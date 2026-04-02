use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize)]
pub struct WorkspaceKeyFile {
    relative_path: String,
    exists: bool,
}

#[derive(Serialize)]
pub struct WorkspaceSkillSummary {
    total_skills: usize,
    total_files: usize,
    skill_names: Vec<String>,
}

#[derive(Serialize)]
pub struct WorkspaceSnapshot {
    resolved_path: String,
    source: String,
    key_files: Vec<WorkspaceKeyFile>,
    skills: WorkspaceSkillSummary,
}

fn default_candidates(cwd: Option<&str>, home_dir: Option<&str>) -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    if let Some(cwd_value) = cwd {
        candidates.push(PathBuf::from(cwd_value));
    }

    if let Some(home) = home_dir {
        candidates.push(Path::new(home).join(".claw-workbench").join("workspace"));
        candidates.push(Path::new(home).join(".openclaw").join("workspace"));
    }

    candidates
}

fn summarize_skills(workspace_path: &Path) -> WorkspaceSkillSummary {
    let skills_root = workspace_path.join("skills");
    if !skills_root.exists() {
        return WorkspaceSkillSummary {
            total_skills: 0,
            total_files: 0,
            skill_names: vec![],
        };
    }

    let mut skill_names: Vec<String> = vec![];
    let mut total_files = 0;

    if let Ok(entries) = fs::read_dir(skills_root) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
                    skill_names.push(name.to_string());
                }
                if let Ok(skill_files) = fs::read_dir(path) {
                    total_files += skill_files.flatten().filter(|file| file.path().is_file()).count();
                }
            }
        }
    }

    skill_names.sort();

    WorkspaceSkillSummary {
        total_skills: skill_names.len(),
        total_files,
        skill_names,
    }
}

#[tauri::command]
pub fn discover_workspace(
    manual_path: Option<String>,
    cwd: Option<String>,
    home_dir: Option<String>,
) -> Result<WorkspaceSnapshot, String> {
    let mut resolved: Option<PathBuf> = None;
    let mut source = "default".to_string();

    for candidate in default_candidates(cwd.as_deref(), home_dir.as_deref()) {
        if candidate.exists() {
            resolved = Some(candidate);
            source = "default".to_string();
            break;
        }
    }

    if resolved.is_none() {
        if let Some(manual) = manual_path {
            let path = PathBuf::from(manual);
            if path.exists() {
                resolved = Some(path);
                source = "manual".to_string();
            }
        }
    }

    let resolved_path = resolved.ok_or_else(|| {
        "No workspace found from default candidates or manual fallback path".to_string()
    })?;

    let key_file_names = vec![
        "AGENTS.md",
        "memory-bank/prd.md",
        "package.json",
        "src-tauri/tauri.conf.json",
    ];

    let key_files = key_file_names
        .iter()
        .map(|relative| WorkspaceKeyFile {
            relative_path: relative.to_string(),
            exists: resolved_path.join(relative).exists(),
        })
        .collect::<Vec<_>>();

    let skills = summarize_skills(&resolved_path);

    Ok(WorkspaceSnapshot {
        resolved_path: resolved_path.to_string_lossy().to_string(),
        source,
        key_files,
        skills,
    })
}
