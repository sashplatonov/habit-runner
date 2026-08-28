# AI Fix Log

## PROG-AN-RVW-001

- Change: separated passive ChartGuideTooltip preview state from explicit modal dialog state.
- Risk: tooltip activation and focus restoration behavior changed; covered by focused unit and Progress E2E checks.
- Rollback: revert the task commit to restore the previous overlay lifecycle.
