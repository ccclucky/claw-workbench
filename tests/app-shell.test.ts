import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';

describe('app shell', () => {
  it('renders the ClawWorkbench home shell', () => {
    render(React.createElement(App));

    expect(screen.getByText('ClawWorkbench')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shape the dragon, not just the config.' })).toBeInTheDocument();
    expect(screen.getByText('Discover workspace')).toBeInTheDocument();
    expect(screen.getByText('Validate results')).toBeInTheDocument();
  });
});
