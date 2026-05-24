#!/bin/bash

# App.tsx
sed -i 's/import { generateTeamEvent, PendingTeamEvent, TeamEventResult } from '\''\.\/domain\/relations\/events'\'';/import { generateTeamEvent } from '\''\.\/domain\/relations\/events'\'';\nimport type { PendingTeamEvent, TeamEventResult } from '\''\.\/domain\/relations\/events'\'';/' src/App.tsx

# RelationsNetwork.tsx
sed -i 's/import React from '\''react'\'';//' src/components/RelationsNetwork.tsx
sed -i 's/import { AgentRelation } from '\''\.\.\/domain\/relations\/types'\'';/import type { AgentRelation } from '\''\.\.\/domain\/relations\/types'\'';/' src/components/RelationsNetwork.tsx
sed -i 's/import { Agent } from '\''\.\.\/domain\/agent'\'';/import type { Agent } from '\''\.\.\/domain\/agent'\'';/' src/components/RelationsNetwork.tsx

# TeamEventDialog.tsx
sed -i 's/import React from '\''react'\'';//' src/components/TeamEventDialog.tsx
sed -i 's/import { PendingTeamEvent, applyTeamEventEffect } from '\''\.\.\/domain\/relations\/events'\'';/import { applyTeamEventEffect } from '\''\.\.\/domain\/relations\/events'\'';\nimport type { PendingTeamEvent, TeamEventResult } from '\''\.\.\/domain\/relations\/events'\'';/' src/components/TeamEventDialog.tsx
sed -i 's/import { TeamEventOption, TeamEventResult } from '\''\.\.\/domain\/relations\/types'\'';/import type { TeamEventOption } from '\''\.\.\/domain\/relations\/types'\'';/' src/components/TeamEventDialog.tsx
sed -i 's/import { Agent } from '\''\.\.\/domain\/agent'\'';/import type { Agent } from '\''\.\.\/domain\/agent'\'';/' src/components/TeamEventDialog.tsx

# teamEvents.ts
sed -i 's/import { TeamEventTemplate } from '\''\.\.\/domain\/relations\/types'\'';/import type { TeamEventTemplate } from '\''\.\.\/domain\/relations\/types'\'';/' src/data/teamEvents.ts

# events.ts
sed -i 's/import { Agent } from '\''\.\.\/agent'\'';/import type { Agent } from '\''\.\.\/agent'\'';/' src/domain/relations/events.ts
sed -i '/import { Project } from/d' src/domain/relations/events.ts
sed -i 's/import { TeamEventTemplate, TeamEventOption, TeamEventEffect } from '\''\.\/types'\'';/import type { TeamEventTemplate, TeamEventEffect } from '\''\.\/types'\'';/' src/domain/relations/events.ts
sed -i 's/import { RNG, rollChance } from '\''\.\.\/random'\'';/import { rollChance } from '\''\.\.\/random'\'';\nimport type { RNG } from '\''\.\.\/random'\'';/' src/domain/relations/events.ts

# manager.ts
sed -i 's/import { AgentRelation } from '\''\.\/types'\'';/import type { AgentRelation } from '\''\.\/types'\'';/' src/domain/relations/manager.ts

