import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders "Pending" label for Pending status', () => {
    render(<StatusBadge status="Pending" taskId={1} onStatusChange={vi.fn()} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders "In Progress" label for InProgress status', () => {
    render(<StatusBadge status="InProgress" taskId={1} onStatusChange={vi.fn()} />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders "Completed" label for Completed status', () => {
    render(<StatusBadge status="Completed" taskId={1} onStatusChange={vi.fn()} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders a select with InProgress option when status is Pending', () => {
    render(<StatusBadge status="Pending" taskId={1} onStatusChange={vi.fn()} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'In Progress' })).toBeInTheDocument();
  });

  it('calls onStatusChange with taskId and new status when select changes', () => {
    const handleChange = vi.fn();
    render(<StatusBadge status="Pending" taskId={3} onStatusChange={handleChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'InProgress' } });
    expect(handleChange).toHaveBeenCalledWith(3, 'InProgress');
  });

  it('renders a read-only span (no select) for Completed status', () => {
    render(<StatusBadge status="Completed" taskId={1} onStatusChange={vi.fn()} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders a disabled select when disabled prop is true', () => {
    render(<StatusBadge status="Pending" taskId={1} disabled onStatusChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('does not call onStatusChange when disabled and select changes', () => {
    const handleChange = vi.fn();
    render(<StatusBadge status="Pending" taskId={1} disabled onStatusChange={handleChange} />);
    // select is disabled — change event should not fire onStatusChange
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'InProgress' } });
    expect(handleChange).not.toHaveBeenCalled();
  });
});
