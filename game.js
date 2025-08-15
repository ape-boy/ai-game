// game.js - 메인 게임 로직

// 게임 상수
const GRID_SIZE = 15;
const CELL_SIZE = 40;

// 게임 상태
const game = {
    floor: 1,
    player: {
        x: 7,
        y: 7,
        hp: 100,
        maxHp: 100,
        level: 1,
        exp: 0,
        maxExp: 100,
        attack: 10,
        defense: 5,
        magic: 0,
        inventory: {
            potions: 3,
            scrolls: 2,
            thunderSpells: 1,
            iceSpells: 1
        }
    },
    map: [],
    entities: [],
    killCount: 0,
    maxPromptScore: 0,
    isMoving: false,
    isBossFight: false,
    currentBoss: null
};

// 타일 타입
const TILES = {
    FLOOR: 0,
    WALL: 1,
    DOOR: 2,
    CHEST: 3,
    STAIRS: 4
};

// 몬스터 데이터
const MONSTERS = {
    SLIME: { 
        icon: '🟢', 
        name: '슬라임', 
        hp: 20, 
        attack: 5, 
        exp: 15,
        loot: { potions: 0.3, scrolls: 0.1 }
    },
    GOBLIN: { 
        icon: '👺', 
        name: '고블린', 
        hp: 30, 
        attack: 8, 
        exp: 25,
        loot: { potions: 0.4, scrolls: 0.2 }
    },
    SKELETON: { 
        icon: '💀', 
        name: '스켈레톤', 
        hp: 40, 
        attack: 12, 
        exp: 35,
        loot: { potions: 0.3, thunderSpells: 0.1 }
    },
    ORC: { 
        icon: '👹', 
        name: '오크', 
        hp: 50, 
        attack: 15, 
        exp: 45,
        loot: { potions: 0.5, iceSpells: 0.1 }
    },
    DEMON: { 
        icon: '👿', 
        name: '악마', 
        hp: 60, 
        attack: 18, 
        exp: 60,
        loot: { scrolls: 0.3, thunderSpells: 0.2, iceSpells: 0.2 }
    }
};

// 초기화
function init() {
    generateMap();
    renderMap();
    updateStats();
    setupEventListeners();
    addMessage('🎮 게임 시작! 5층마다 보스가 등장합니다!', 'welcome');
    addMessage('💡 프롬프트의 품질이 마법 위력을 결정합니다!', 'info');
}

// 맵 생성
function generateMap() {
    // 맵 초기화
    game.map = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILES.WALL));
    game.entities = [];
    
    // 방 생성
    const rooms = [];
    const numRooms = 4 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numRooms; i++) {
        const room = {
            x: 1 + Math.floor(Math.random() * (GRID_SIZE - 8)),
            y: 1 + Math.floor(Math.random() * (GRID_SIZE - 8)),
            w: 4 + Math.floor(Math.random() * 4),
            h: 4 + Math.floor(Math.random() * 4)
        };
        
        // 방 채우기
        for (let y = room.y; y < room.y + room.h && y < GRID_SIZE - 1; y++) {
            for (let x = room.x; x < room.x + room.w && x < GRID_SIZE - 1; x++) {
                game.map[y][x] = TILES.FLOOR;
            }
        }
        
        rooms.push(room);
    }
    
    // 방 연결
    for (let i = 0; i < rooms.length - 1; i++) {
        connectRooms(rooms[i], rooms[i + 1]);
    }
    
    // 플레이어 시작 위치
    const startRoom = rooms[0];
    game.player.x = Math.floor(startRoom.x + startRoom.w / 2);
    game.player.y = Math.floor(startRoom.y + startRoom.h / 2);
    
    // 보스층 체크
    if (game.floor % 5 === 0) {
        // 보스 배치
        const bossRoom = rooms[rooms.length - 1];
        const bossX = Math.floor(bossRoom.x + bossRoom.w / 2);
        const bossY = Math.floor(bossRoom.y + bossRoom.h / 2);
        
        const bossData = getBossForFloor(game.floor);
        game.entities.push({
            x: bossX,
            y: bossY,
            ...bossData,
            type: 'boss',
            maxHp: bossData.hp
        });
    } else {
        // 일반 층 - 계단 배치
        const stairsRoom = rooms[rooms.length - 1];
        const stairsX = Math.floor(stairsRoom.x + stairsRoom.w / 2);
        const stairsY = Math.floor(stairsRoom.y + stairsRoom.h / 2);
        game.map[stairsY][stairsX] = TILES.STAIRS;
        
        // 몬스터 배치
        placeMonsters(rooms);
    }
    
    // 보물상자 배치
    if (Math.random() < 0.6) {
        const chestRoom = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
        const chestX = Math.floor(chestRoom.x + Math.random() * chestRoom.w);
        const chestY = Math.floor(chestRoom.y + Math.random() * chestRoom.h);
        if (game.map[chestY][chestX] === TILES.FLOOR) {
            game.map[chestY][chestX] = TILES.CHEST;
        }
    }
}

// 방 연결
function connectRooms(room1, room2) {
    const x1 = Math.floor(room1.x + room1.w / 2);
    const y1 = Math.floor(room1.y + room1.h / 2);
    const x2 = Math.floor(room2.x + room2.w / 2);
    const y2 = Math.floor(room2.y + room2.h / 2);
    
    // 수평 연결
    const startX = Math.min(x1, x2);
    const endX = Math.max(x1, x2);
    for (let x = startX; x <= endX; x++) {
        game.map[y1][x] = TILES.FLOOR;
    }
    
    // 수직 연결
    const startY = Math.min(y1, y2);
    const endY = Math.max(y1, y2);
    for (let y = startY; y <= endY; y++) {
        game.map[y][x2] = TILES.FLOOR;
    }
}

// 몬스터 배치
function placeMonsters(rooms) {
    const monsterCount = Math.min(8, 3 + Math.floor(game.floor / 2));
    const availableMonsters = getAvailableMonsters();
    
    for (let i = 0; i < monsterCount; i++) {
        const room = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
        const x = Math.floor(room.x + Math.random() * room.w);
        const y = Math.floor(room.y + Math.random() * room.h);
        
        if (game.map[y][x] === TILES.FLOOR && !isOccupied(x, y)) {
            const monsterType = availableMonsters[Math.floor(Math.random() * availableMonsters.length)];
            game.entities.push({
                x: x,
                y: y,
                ...JSON.parse(JSON.stringify(monsterType)),
                type: 'enemy',
                maxHp: monsterType.hp
            });
        }
    }
}

// 층수에 따른 몬스터 선택
function getAvailableMonsters() {
    const monsters = [MONSTERS.SLIME];
    
    if (game.floor >= 2) monsters.push(MONSTERS.GOBLIN);
    if (game.floor >= 4) monsters.push(MONSTERS.SKELETON);
    if (game.floor >= 6) monsters.push(MONSTERS.ORC);
    if (game.floor >= 8) monsters.push(MONSTERS.DEMON);
    
    return monsters;
}

// 위치 점유 확인
function isOccupied(x, y) {
    return game.entities.some(e => e.x === x && e.y === y) ||
           (game.player.x === x && game.player.y === y);
}

// 맵 렌더링
function renderMap() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    
    // 타일 렌더링
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            switch(game.map[y][x]) {
                case TILES.WALL:
                    cell.classList.add('wall');
                    break;
                case TILES.FLOOR:
                    cell.classList.add('floor');
                    break;
                case TILES.CHEST:
                    cell.classList.add('chest');
                    cell.textContent = '📦';
                    break;
                case TILES.STAIRS:
                    cell.classList.add('stairs');
                    cell.textContent = '🔽';
                    break;
            }
            
            board.appendChild(cell);
        }
    }
    
    // 플레이어 렌더링
    const player = document.createElement('div');
    player.className = 'entity player';
    player.id = 'player';
    player.style.left = game.player.x * CELL_SIZE + 'px';
    player.style.top = game.player.y * CELL_SIZE + 'px';
    player.textContent = '🧙';
    board.appendChild(player);
    
    // 엔티티 렌더링
    game.entities.forEach((entity, index) => {
        const el = document.createElement('div');
        el.className = `entity ${entity.type}`;
        el.id = `entity-${index}`;
        el.style.left = entity.x * CELL_SIZE + 'px';
        el.style.top = entity.y * CELL_SIZE + 'px';
        el.textContent = entity.icon;
        board.appendChild(el);
    });
}

// 플레이어 이동
function movePlayer(dx, dy) {
    if (game.isMoving || game.isBossFight) return;
    
    const newX = game.player.x + dx;
    const newY = game.player.y + dy;
    
    // 경계 체크
    if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) return;
    
    // 벽 체크
    if (game.map[newY][newX] === TILES.WALL) return;
    
    // 엔티티 체크
    const entity = game.entities.find(e => e.x === newX && e.y === newY);
    if (entity) {
        if (entity.type === 'enemy') {
            combat(entity);
        } else if (entity.type === 'boss') {
            triggerBossFight(entity);
        }
        return;
    }
    
    // 이동 실행
    game.isMoving = true;
    game.player.x = newX;
    game.player.y = newY;
    
    const playerEl = document.getElementById('player');
    playerEl.style.left = newX * CELL_SIZE + 'px';
    playerEl.style.top = newY * CELL_SIZE + 'px';
    
    // 타일 상호작용
    handleTileInteraction(newX, newY);
    
    // 몬스터 턴
    setTimeout(() => {
        moveMonsters();
        game.isMoving = false;
    }, 150);
}

// 타일 상호작용
function handleTileInteraction(x, y) {
    const tile = game.map[y][x];
    
    if (tile === TILES.CHEST) {
        openChest(x, y);
    } else if (tile === TILES.STAIRS) {
        nextFloor();
    }
}

// 전투
function combat(enemy) {
    const playerDamage = Math.max(1, game.player.attack + Math.floor(Math.random() * 10) - 5);
    enemy.hp -= playerDamage;
    
    showDamage(enemy.x, enemy.y, playerDamage, false);
    addMessage(`${enemy.name}에게 ${playerDamage} 데미지!`, 'combat');
    
    if (enemy.hp <= 0) {
        // 적 처치
        defeatEnemy(enemy);
    } else {
        // 반격
        const enemyDamage = Math.max(1, enemy.attack - game.player.defense + Math.floor(Math.random() * 5));
        game.player.hp -= enemyDamage;
        
        showDamage(game.player.x, game.player.y, enemyDamage, true);
        addMessage(`${enemy.name}의 반격! -${enemyDamage} HP`, 'combat');
        
        if (game.player.hp <= 0) {
            gameOver();
        }
    }
    
    updateStats();
}

// 적 처치
function defeatEnemy(enemy) {
    const index = game.entities.indexOf(enemy);
    game.entities.splice(index, 1);
    
    const el = document.getElementById(`entity-${index}`);
    if (el) el.remove();
    
    // 경험치 획득
    game.player.exp += enemy.exp;
    game.killCount++;
    addMessage(`${enemy.name} 처치! +${enemy.exp} EXP`, 'success');
    
    // 레벨업 체크
    if (game.player.exp >= game.player.maxExp) {
        levelUp();
    }
    
    // 아이템 드롭
    dropLoot(enemy);
    
    updateStats();
}

// 아이템 드롭
function dropLoot(enemy) {
    if (enemy.loot) {
        for (const [item, chance] of Object.entries(enemy.loot)) {
            if (Math.random() < chance) {
                switch(item) {
                    case 'potions':
                        game.player.inventory.potions++;
                        addMessage('🧪 체력 포션 획득!', 'loot');
                        break;
                    case 'scrolls':
                        game.player.inventory.scrolls++;
                        addMessage('📜 프롬프트 스크롤 획득!', 'loot');
                        break;
                    case 'thunderSpells':
                        game.player.inventory.thunderSpells++;
                        addMessage('⚡ 번개 주문서 획득!', 'loot');
                        break;
                    case 'iceSpells':
                        game.player.inventory.iceSpells++;
                        addMessage('❄️ 얼음 주문서 획득!', 'loot');
                        break;
                }
                updateInventory();
                break; // 한 번에 하나만 드롭
            }
        }
    }
}

// 몬스터 이동
function moveMonsters() {
    game.entities.forEach((entity, index) => {
        if (entity.type !== 'enemy') return;
        
        const dx = game.player.x - entity.x;
        const dy = game.player.y - entity.y;
        const distance = Math.abs(dx) + Math.abs(dy);
        
        // 플레이어가 가까우면 추적
        if (distance <= 5 && distance > 1) {
            let moveX = 0, moveY = 0;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                moveX = dx > 0 ? 1 : -1;
            } else {
                moveY = dy > 0 ? 1 : -1;
            }
            
            const newX = entity.x + moveX;
            const newY = entity.y + moveY;
            
            // 이동 가능 체크
            if (game.map[newY][newX] === TILES.FLOOR && !isOccupied(newX, newY)) {
                entity.x = newX;
                entity.y = newY;
                
                const el = document.getElementById(`entity-${index}`);
                if (el) {
                    el.style.left = newX * CELL_SIZE + 'px';
                    el.style.top = newY * CELL_SIZE + 'px';
                }
            }
        } else if (distance === 1) {
            // 인접하면 공격
            const damage = Math.max(1, entity.attack - game.player.defense + Math.floor(Math.random() * 5));
            game.player.hp -= damage;
            
            showDamage(game.player.x, game.player.y, damage, true);
            addMessage(`${entity.name}의 공격! -${damage} HP`, 'combat');
            
            if (game.player.hp <= 0) {
                gameOver();
            }
            updateStats();
        }
    });
}

// 상자 열기
function openChest(x, y) {
    game.map[y][x] = TILES.FLOOR;
    
    const loot = Math.random();
    if (loot < 0.4) {
        game.player.inventory.potions += 2;
        addMessage('🧪 체력 포션 x2 획득!', 'loot');
    } else if (loot < 0.7) {
        game.player.inventory.scrolls++;
        addMessage('📜 프롬프트 스크롤 획득!', 'loot');
    } else if (loot < 0.85) {
        game.player.inventory.thunderSpells++;
        addMessage('⚡ 번개 주문서 획득!', 'loot');
    } else {
        game.player.maxHp += 20;
        game.player.hp += 20;
        addMessage('💖 최대 체력 +20!', 'loot');
    }
    
    updateStats();
    updateInventory();
    renderMap();
}

// 다음 층
function nextFloor() {
    game.floor++;
    addMessage(`=== ${game.floor}층 진입 ===`, 'info');
    
    // 체력 회복
    game.player.hp = Math.min(game.player.maxHp, game.player.hp + 30);
    
    generateMap();
    renderMap();
    updateStats();
    
    // 보스층 체크
    if (game.floor % 5 === 0) {
        setTimeout(() => {
            const boss = game.entities.find(e => e.type === 'boss');
            if (boss) {
                showBossIntro(boss);
            }
        }, 500);
    }
}

// 레벨업
function levelUp() {
    game.player.level++;
    game.player.exp = 0;
    game.player.maxExp = game.player.level * 100;
    game.player.maxHp += 25;
    game.player.hp = game.player.maxHp;
    game.player.attack += 5;
    game.player.defense += 3;
    game.player.magic += 10;
    
    // 레벨업 이펙트
    const effect = document.getElementById('levelupEffect');
    effect.classList.add('active');
    setTimeout(() => effect.classList.remove('active'), 1500);
    
    addMessage(`🎉 레벨업! Level ${game.player.level}`, 'success');
    addMessage(`모든 능력치 상승!`, 'success');
    
    updateStats();
}

// 아이템 사용
function useItem(type) {
    switch(type) {
        case 1: // 포션
            if (game.player.inventory.potions > 0) {
                if (game.player.hp >= game.player.maxHp) {
                    addMessage('체력이 이미 최대입니다!', 'info');
                    return;
                }
                game.player.inventory.potions--;
                const healAmount = 50;
                game.player.hp = Math.min(game.player.maxHp, game.player.hp + healAmount);
                showDamage(game.player.x, game.player.y, `+${healAmount}`, false, true);
                addMessage(`체력 포션 사용! +${healAmount} HP`, 'success');
            }
            break;
            
        case 2: // 스크롤
            if (game.player.inventory.scrolls > 0) {
                game.player.inventory.scrolls--;
                openPrompt();
                addMessage('프롬프트 스크롤 사용! 강력한 마법을 시전하세요!', 'info');
            }
            break;
            
        case 3: // 번개
            if (game.player.inventory.thunderSpells > 0) {
                game.player.inventory.thunderSpells--;
                castSpell('thunder');
            }
            break;
            
        case 4: // 얼음
            if (game.player.inventory.iceSpells > 0) {
                game.player.inventory.iceSpells--;
                castSpell('ice');
            }
            break;
    }
    
    updateStats();
    updateInventory();
}

// 주문 시전
function castSpell(type) {
    if (type === 'thunder') {
        addMessage('⚡ 번개 폭풍 시전!', 'success');
        game.entities.filter(e => e.type === 'enemy').forEach(enemy => {
            const damage = 30 + game.player.magic;
            enemy.hp -= damage;
            showDamage(enemy.x, enemy.y, damage, false);
            
            if (enemy.hp <= 0) {
                defeatEnemy(enemy);
            }
        });
    } else if (type === 'ice') {
        addMessage('❄️ 얼음 결계 시전! 모든 적 동결!', 'success');
        game.entities.filter(e => e.type === 'enemy').forEach(enemy => {
            const damage = 20 + game.player.magic;
            enemy.hp -= damage;
            showDamage(enemy.x, enemy.y, damage, false);
            
            if (enemy.hp <= 0) {
                defeatEnemy(enemy);
            }
        });
    }
}

// 프롬프트 열기
function openPrompt() {
    document.getElementById('promptPanel').style.display = 'block';
    document.getElementById('systemPrompt').focus();
}

// 프롬프트 닫기
function closePrompt() {
    document.getElementById('promptPanel').style.display = 'none';
    document.getElementById('systemPrompt').value = '';
    document.getElementById('userPrompt').value = '';
}

// 데미지 표시
function showDamage(x, y, damage, isPlayer = false, isHeal = false) {
    const board = document.getElementById('gameBoard');
    const damageText = document.createElement('div');
    damageText.className = 'damage-text';
    
    if (isHeal) {
        damageText.classList.add('heal');
    } else if (isPlayer) {
        damageText.classList.add('player-damage');
    } else {
        damageText.classList.add('enemy-damage');
    }
    
    damageText.textContent = isHeal ? damage : `-${damage}`;
    damageText.style.left = (x * CELL_SIZE + 10) + 'px';
    damageText.style.top = (y * CELL_SIZE - 10) + 'px';
    
    board.appendChild(damageText);
    setTimeout(() => damageText.remove(), 1000);
}

// 메시지 추가
function addMessage(text, type = '') {
    const log = document.getElementById('messageLog');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    log.appendChild(message);
    log.scrollTop = log.scrollHeight;
    
    // 오래된 메시지 제거
    if (log.children.length > 50) {
        log.removeChild(log.children[0]);
    }
}

// 스탯 업데이트
function updateStats() {
    document.getElementById('floor').textContent = game.floor;
    document.getElementById('hp').textContent = Math.max(0, game.player.hp);
    document.getElementById('maxHp').textContent = game.player.maxHp;
    document.getElementById('level').textContent = game.player.level;
    document.getElementById('attack').textContent = game.player.attack;
    document.getElementById('defense').textContent = game.player.defense;
    document.getElementById('magic').textContent = game.player.magic;
    
    // HP 바
    const hpPercent = (game.player.hp / game.player.maxHp) * 100;
    document.getElementById('hpBar').style.width = hpPercent + '%';
    
    // EXP 바
    const expPercent = (game.player.exp / game.player.maxExp) * 100;
    document.getElementById('expBar').style.width = expPercent + '%';
}

// 인벤토리 업데이트
function updateInventory() {
    document.getElementById('potion-count').textContent = game.player.inventory.potions;
    document.getElementById('scroll-count').textContent = game.player.inventory.scrolls;
    document.getElementById('thunder-count').textContent = game.player.inventory.thunderSpells;
    document.getElementById('ice-count').textContent = game.player.inventory.iceSpells;
}

// 게임 오버
function gameOver() {
    document.getElementById('finalFloor').textContent = game.floor;
    document.getElementById('finalLevel').textContent = game.player.level;
    document.getElementById('finalKills').textContent = game.killCount;
    document.getElementById('finalPromptScore').textContent = game.maxPromptScore;
    document.getElementById('gameOverOverlay').classList.add('active');
}

// 이벤트 리스너 설정
function setupEventListeners() {
    document.addEventListener('keydown', handleKeyPress);
    
    // 퀵슬롯 클릭
    document.querySelectorAll('.slot').forEach(slot => {
        slot.addEventListener('click', () => {
            const key = parseInt(slot.dataset.key);
            useItem(key);
        });
    });
}

// 키 입력 처리
function handleKeyPress(e) {
    // 프롬프트 입력 중이면 무시
    if (document.activeElement.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
            closePrompt();
        }
        return;
    }
    
    // 게임 오버시 무시
    if (document.getElementById('gameOverOverlay').classList.contains('active')) {
        return;
    }
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            e.preventDefault();
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            e.preventDefault();
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            movePlayer(1, 0);
            break;
        case ' ':
            e.preventDefault();
            // 인접한 적 공격
            attackAdjacent();
            break;
        case 'p':
        case 'P':
            openPrompt();
            break;
        case '1':
        case '2':
        case '3':
        case '4':
            useItem(parseInt(e.key));
            break;
        case 'Escape':
            closePrompt();
            break;
    }
}

// 인접한 적 공격
function attackAdjacent() {
    const adjacent = game.entities.find(e => 
        (e.type === 'enemy' || e.type === 'boss') &&
        Math.abs(e.x - game.player.x) <= 1 &&
        Math.abs(e.y - game.player.y) <= 1
    );
    
    if (adjacent) {
        if (adjacent.type === 'boss' && !game.isBossFight) {
            triggerBossFight(adjacent);
        } else {
            combat(adjacent);
        }
    }
}

// 게임 시작
window.addEventListener('DOMContentLoaded', init);
