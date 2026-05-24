# Manual Test Checklist

## 1. Create Game
- [ ] Start a new game — save slot selection appears
- [ ] Select slot 1, 2, or 3 — game initializes with default state
- [ ] Funds = 5000, engineers available, projects visible
- [ ] Locked engineers are shown but cannot be selected

## 2. Run Sprint
- [ ] Select at least 1 engineer, 1 project, 1 strategy
- [ ] Click "Run Sprint" — result report appears
- [ ] Progress, bugs, tech debt, morale changes are shown
- [ ] Incidents appear (if triggered)
- [ ] Funds decrease by engineer salaries
- [ ] Sprint counter increments

## 3. Team Events
- [ ] Random team event dialog appears before sprint (~15% chance)
- [ ] Each option produces different outcomes
- [ ] Relation changes reflected after event resolution

## 4. Multi-sprint Gameplay
- [ ] Engineers gain fatigue (max 100), rest when not selected
- [ ] Consecutive sprint penalty (morale -5 after 3+ consecutive)
- [ ] Skills improve after each sprint
- [ ] Career total increments

## 5. Save / Load
- [ ] Manual save to each slot works
- [ ] Load game from slot restores exact state
- [ ] Autosave triggers (check interval config)
- [ ] Multiple save slots show different metadata
- [ ] Delete slot works

## 6. Achievement Unlock
- [ ] First project completed triggers "初露锋芒"
- [ ] Progress tracking shows in Achievement Panel
- [ ] Toast notification appears in top-right
- [ ] Multiple achievements can unlock in one sprint

## 7. Game Over
- [ ] Bankruptcy (funds ≤ 0) triggers game over screen
- [ ] All engineers morale = 0 triggers game over screen
- [ ] Game over screen shows final stats
- [ ] Reset button works

## 8. Skill Tree
- [ ] Click on engineer to open skill tree modal
- [ ] Prerequisites shown (lock states)
- [ ] Unlock reduces company funds
- [ ] Skill effect applies to engineer

## 9. UI / UX
- [ ] Responsive layout works on mobile viewport
- [ ] Cards have hover animations
- [ ] Loading/transition states present
- [ ] No console errors in browser
