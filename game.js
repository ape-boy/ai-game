// game-new.js - 개선된 마법소년 김씨의 던전 어드벤처

// 게임 상수
const GRID_SIZE = 15;
const CELL_SIZE = 40;
// 정적 서비스로 변경 - 클라이언트에서 직접 OpenRouter API 호출
const OPENROUTER_API_KEY = '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';
const OPENROUTER_MODEL = 'qwen/qwen3-235b-a22b-2507';

// 게임 상태
const game = {
    floor: 1,
    player: {
        x: 7,
        y: 7,
        hp: 80,
        maxHp: 80,
        level: 1,
        exp: 0,
        maxExp: 100,
        attack: 8,
        defense: 3,
        hintBook: 0,
        lastPromptScore: 0,
        streak: 0,
        maxStreak: 0,
        spellsLearned: ['fireball', 'heal'], // 기본 마법
        totalKills: 0
    },
    map: [],
    entities: [],
    killCount: 0,
    maxPromptScore: 0,
    isMoving: false,
    isBossFight: false,
    isBattleMode: false,
    isUltimateMode: false,
    selectedEntity: null,
    cursorX: 7,
    cursorY: 7,
    gameMode: 'explore',
    battleTimer: 0,
    battleTimeLimit: 10,
    currentBattleData: null,
    manaPoints: 50,
    maxMana: 50,
    spellCooldowns: {
        fireball: 0,
        meteor: 0,
        lightning: 0,
        heal: 0
    },
    animations: {
        enabled: true,
        speed: 200  // 애니메이션 속도 (ms)
    }
};

// 타일 타입
const TILES = {
    FLOOR: 0,
    WALL: 1,
    DOOR: 2,
    CHEST: 3,
    STAIRS: 4
};

// 스펠 데이터 (AOE 마법 시스템)
const SPELLS = {
    fireball: {
        name: '화염구',
        icon: '🔥',
        manaCost: 10,
        cooldown: 3,
        damage: 40,
        range: 1,
        aoe: true,
        description: '주변의 적들에게 화염 피해'
    },
    meteor: {
        name: '메테오',
        icon: '☄️',
        manaCost: 25,
        cooldown: 8,
        damage: 80,
        range: 2,
        aoe: true,
        description: '넓은 범위에 강력한 충격 피해'
    },
    lightning: {
        name: '번개',
        icon: '⚡',
        manaCost: 15,
        cooldown: 5,
        damage: 60,
        range: 3,
        aoe: false,
        description: '직선상의 모든 적을 관통'
    },
    heal: {
        name: '치유',
        icon: '💚',
        manaCost: 12,
        cooldown: 6,
        damage: -30, // 음수는 회복
        range: 0,
        aoe: false,
        description: '체력 회복'
    }
};

// 몬스터 데이터 (객관식 전투용)
const MONSTERS = {
    SLIME: { 
        icon: '🟢', 
        name: '슬라임', 
        hp: 30,
        attack: 6, 
        defense: 1,
        exp: 25,
        pattern: 'split',
        description: '물컹한 젤리 같은 생물',
        question: '슬라임의 가장 효과적인 공격 방법은?',
        choices: [
            { text: '강력한 물리 공격', correct: false, damage: 50 },
            { text: '화염 마법으로 건조', correct: true, damage: 150 },
            { text: '얼음 마법으로 냉각', correct: false, damage: 70 },
            { text: '바람 마법으로 밀어내기', correct: false, damage: 60 }
        ],
        hint: '물로 이루어진 생명체는 열에 약하다!'
    },
    GOBLIN: { 
        icon: '👺', 
        name: '고블린', 
        hp: 40, 
        attack: 8, 
        defense: 2,
        exp: 30,
        pattern: 'pack',
        description: '작고 빠른 몬스터',
        question: '고블린을 물리치는 최고의 전략은?',
        choices: [
            { text: '정면 돌격으로 압박', correct: false, damage: 60 },
            { text: '밝은 빛으로 눈부시게 하기', correct: true, damage: 140 },
            { text: '독 마법으로 서서히 약화', correct: false, damage: 80 },
            { text: '방어막을 치고 기다리기', correct: false, damage: 40 }
        ],
        hint: '어둠을 좋아하는 소심한 생물이다.'
    },
    SKELETON: { 
        icon: '💀', 
        name: '스켈레톤', 
        hp: 50, 
        attack: 12,
        defense: 4, 
        exp: 40,
        pattern: 'revive',
        description: '해골 전사',
        question: '언데드인 스켈레톤에게 가장 효과적인 것은?',
        choices: [
            { text: '더 강한 물리 공격', correct: false, damage: 70 },
            { text: '신성한 빛의 마법', correct: true, damage: 180 },
            { text: '독성 가스 공격', correct: false, damage: 30 },
            { text: '전기 충격', correct: false, damage: 90 }
        ],
        hint: '죽음을 거스른 존재는 신성한 힘에 약하다.'
    },
    ORC: { 
        icon: '👹', 
        name: '오크', 
        hp: 65, 
        attack: 15, 
        defense: 5,
        exp: 50,
        pattern: 'rage',
        description: '강한 근력의 야만 전사',
        question: '힘만 믿는 오크를 어떻게 이길까?',
        choices: [
            { text: '힘으로 정면승부', correct: false, damage: 50 },
            { text: '지능적인 함정 설치', correct: true, damage: 160 },
            { text: '마법 방패로 방어', correct: false, damage: 40 },
            { text: '빠른 속도로 도망', correct: false, damage: 20 }
        ],
        hint: '뇌근육인 상대에겐 머리를 써야 한다!'
    }
};

// 보스 데이터
const BOSS_DATA = {
    5: { 
        icon: '👑', 
        name: '슬라임 킹', 
        hp: 200, 
        attack: 25, 
        defense: 8, 
        exp: 150,
        description: '거대한 슬라임의 왕',
        weakness: '고온의 열기와 건조'
    },
    10: { 
        icon: '🐉', 
        name: '던전 드래곤', 
        hp: 400, 
        attack: 35, 
        defense: 12, 
        exp: 300,
        description: '던전의 지배자인 고대 용',
        weakness: '얼음과 신성한 마법의 조합'
    }
};

// 게임 인트로 시나리오
function showGameIntro() {
    addMessage('✨ 마법소년 김씨의 모험', 'welcome');
    addMessage('', 'info');
    addMessage('🏠 평범한 직장인 김소년(24세)은 어느 날 기이한 기운으로', 'info');
    addMessage('🌀 마법의 세계로 소환되었습니다.', 'info');
    addMessage('', 'info');
    addMessage('📜 이 세계에서 살아남기 위해서는 마법을 사용해야 합니다.', 'info');
    addMessage('⚡ 하지만 여기에서의 마법은 상상력과 논리적 사고로 만들어집니다.', 'info');
    addMessage('', 'info');
    addMessage('🎯 목표: 원래 세계로 돌아가기 위해 던전을 탐험하고', 'info');
    addMessage('🔮 최종 보스를 물리쳐 차원의 문을 열어야 합니다.', 'info');
    addMessage('', 'info');
    addMessage('🎮 조작법:', 'welcome');
    addMessage('⬆️ WASD 또는 화살표: 이동', 'info');
    addMessage('🎯 T키: 탐험/전투 모드 전환', 'info');
    addMessage('⚙️ SPACE: 선택/행동', 'info');
    addMessage('⚡ F키: 보스전 필살기', 'info');
    addMessage('🔢 1,2,3,4: 전투 중 선택', 'info');
    addMessage('', 'info');
    addMessage('📚 힌트북을 찾아 마법 지식을 늘려보세요!', 'loot');
    addMessage('💪 객관식 전투에서 정답을 빠르게 선택하세요!', 'combat');
    addMessage('', 'info');
    addMessage('🔥 마법 단축키:', 'welcome');
    addMessage('🔥 Q: 화염구 | 2: 메테오 | E: 번개 | R: 치유', 'info');
}

// 초기화
function init() {
    generateMap();
    renderMap();
    updateStats();
    setupEventListeners();
    showGameIntro();
    
    game.cursorX = game.player.x;
    game.cursorY = game.player.y;
    
    // 패널 숨김 초기화
    document.getElementById('battlePanel').style.display = 'none';
    document.getElementById('ultimatePanel').style.display = 'none';
}

// 맵 생성
function generateMap() {
    game.map = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILES.WALL));
    game.entities = [];
    
    const rooms = [];
    const numRooms = 4 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numRooms; i++) {
        const room = {
            x: 1 + Math.floor(Math.random() * (GRID_SIZE - 8)),
            y: 1 + Math.floor(Math.random() * (GRID_SIZE - 8)),
            w: 4 + Math.floor(Math.random() * 4),
            h: 4 + Math.floor(Math.random() * 4)
        };
        
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
        // 계단 배치
        const stairsRoom = rooms[rooms.length - 1];
        const stairsX = Math.floor(stairsRoom.x + stairsRoom.w / 2);
        const stairsY = Math.floor(stairsRoom.y + stairsRoom.h / 2);
        game.map[stairsY][stairsX] = TILES.STAIRS;
        
        // 몬스터 배치
        placeMonsters(rooms);
        
        // 상자 배치
        placeChests(rooms);
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
    const monsterCount = Math.min(6, 3 + Math.floor(game.floor / 2));
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

// 상자 배치 (힌트북 아이템 포함)
function placeChests(rooms) {
    const chestCount = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < chestCount; i++) {
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const chestX = Math.floor(room.x + Math.random() * room.w);
        const chestY = Math.floor(room.y + Math.random() * room.h);
        
        if (game.map[chestY][chestX] === TILES.FLOOR) {
            game.map[chestY][chestX] = TILES.CHEST;
        }
    }
}

// 층수에 따른 몬스터 선택
function getAvailableMonsters() {
    const monsters = [MONSTERS.SLIME];
    
    if (game.floor >= 2) monsters.push(MONSTERS.GOBLIN);
    if (game.floor >= 3) monsters.push(MONSTERS.SKELETON);
    if (game.floor >= 5) monsters.push(MONSTERS.ORC);
    
    return monsters;
}

// 보스 데이터 가져오기
function getBossForFloor(floor) {
    return BOSS_DATA[floor] || BOSS_DATA[10];
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
    
    updateCursorDisplay();
}

// 플레이어 이동
function movePlayer(dx, dy) {
    if (game.isMoving || game.isBossFight || game.isBattleMode) return;
    
    const newX = game.player.x + dx;
    const newY = game.player.y + dy;
    
    if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) return;
    if (game.map[newY][newX] === TILES.WALL) return;
    
    const entity = game.entities.find(e => e.x === newX && e.y === newY);
    if (entity) {
        if (entity.type === 'enemy') {
            startBattleMode(entity);
        } else if (entity.type === 'boss') {
            triggerBossFight(entity);
        }
        return;
    }
    
    // 상자 확인
    if (game.map[newY][newX] === TILES.CHEST) {
        openChest(newX, newY);
        return;
    }
    
    // 계단 확인
    if (game.map[newY][newX] === TILES.STAIRS) {
        nextFloor();
        return;
    }
    
    game.isMoving = true;
    game.player.x = newX;
    game.player.y = newY;
    
    updatePlayerPosition();
    
    // 몬스터 AI 추가 체크
    
    setTimeout(() => {
        moveMonsters();
        game.isMoving = false;
    }, game.animations.speed);  // 애니메이션 속도 개선
}

// 플레이어 위치 업데이트
function updatePlayerPosition() {
    const player = document.getElementById('player');
    player.style.left = game.player.x * CELL_SIZE + 'px';
    player.style.top = game.player.y * CELL_SIZE + 'px';
    
    game.cursorX = game.player.x;
    game.cursorY = game.player.y;
    updateCursorDisplay();
}

// 객관식 전투 시작
function startBattleMode(enemy) {
    game.isBattleMode = true;
    game.selectedEntity = enemy;
    game.currentBattleData = enemy;
    game.battleTimer = game.battleTimeLimit;
    
    // 전투 패널 표시
    const battlePanel = document.getElementById('battlePanel');
    battlePanel.style.display = 'block';
    
    // 질문과 선택지 설정
    document.getElementById('questionText').textContent = enemy.question;
    document.getElementById('battleHint').textContent = `💡 ${enemy.hint}`;
    
    const choices = document.querySelectorAll('.choice');
    choices.forEach((choice, index) => {
        choice.classList.remove('selected', 'correct', 'wrong');
        choice.querySelector('.choice-text').textContent = enemy.choices[index].text;
        choice.querySelector('.choice-result').textContent = '';
    });
    
    addMessage(`⚔️ ${enemy.name}과의 전투! 빠르게 선택하세요!`, 'combat');
    
    // 타이머 시작
    startBattleTimer();
}

// 전투 타이머 시작
function startBattleTimer() {
    const timerInterval = setInterval(() => {
        game.battleTimer--;
        document.getElementById('battleTimer').textContent = game.battleTimer;
        
        if (game.battleTimer <= 0) {
            clearInterval(timerInterval);
            // 시간 초과 시 자동으로 첫 번째 선택지 선택
            selectBattleChoice(0);
        }
    }, 1000);
    
    game.battleTimerInterval = timerInterval;
}

// 전투 선택지 선택
function selectBattleChoice(choiceIndex) {
    if (!game.isBattleMode || !game.currentBattleData) return;
    
    clearInterval(game.battleTimerInterval);
    
    const enemy = game.currentBattleData;
    const choice = enemy.choices[choiceIndex];
    const choiceElements = document.querySelectorAll('.choice');
    
    // 선택한 항목 표시
    choiceElements[choiceIndex].classList.add('selected');
    
    setTimeout(() => {
        // 정답/오답 표시
        enemy.choices.forEach((c, index) => {
            const element = choiceElements[index];
            if (c.correct) {
                element.classList.add('correct');
                element.querySelector('.choice-result').textContent = '✅';
            } else if (index === choiceIndex) {
                element.classList.add('wrong');
                element.querySelector('.choice-result').textContent = '❌';
            }
        });
        
        // 데미지 계산 및 적용
        const damage = choice.damage + Math.floor(Math.random() * 20);
        enemy.hp -= damage;
        
        showDamage(enemy.x, enemy.y, damage, false);
        
        if (choice.correct) {
            game.player.streak++;
            addMessage(`🎯 정답! ${enemy.name}에게 ${damage} 데미지!`, 'success');
            showComboEffect();
        } else {
            game.player.streak = 0;
            addMessage(`💥 ${enemy.name}에게 ${damage} 데미지! (정답이 아니었지만 공격성공)`, 'combat');
        }
        
        setTimeout(() => {
            if (enemy.hp <= 0) {
                defeatEnemy(enemy);
            } else {
                // 적의 반격
                enemyCounterAttack(enemy);
            }
            closeBattlePanel();
        }, 1500);
        
    }, 1000);
}

// 적의 반격
function enemyCounterAttack(enemy) {
    const damage = Math.max(1, enemy.attack - game.player.defense + Math.floor(Math.random() * 5));
    game.player.hp -= damage;
    
    showDamage(game.player.x, game.player.y, damage, true);
    addMessage(`${enemy.name}의 반격! -${damage} HP`, 'combat');
    
    if (game.player.hp <= 0) {
        gameOver();
        return;
    }
    
    updateStats();
}

// 전투 패널 닫기
function closeBattlePanel() {
    document.getElementById('battlePanel').style.display = 'none';
    game.isBattleMode = false;
    game.currentBattleData = null;
    
    if (game.battleTimerInterval) {
        clearInterval(game.battleTimerInterval);
    }
}

// 연속 성공 효과
function showComboEffect() {
    if (game.player.streak > 1) {
        const comboText = document.createElement('div');
        comboText.className = 'combo-text';
        comboText.textContent = `${game.player.streak} COMBO!`;
        comboText.style.left = (game.player.x * CELL_SIZE + 20) + 'px';
        comboText.style.top = (game.player.y * CELL_SIZE - 20) + 'px';
        
        document.getElementById('gameBoard').appendChild(comboText);
        
        setTimeout(() => {
            if (comboText.parentNode) {
                comboText.remove();
            }
        }, 1000);  // 더 빠른 효과 제거
        
        // 스트릭 보너스
        const bonus = game.player.streak * 5;
        game.player.exp += bonus;
        addMessage(`🔥 ${game.player.streak} 연속 성공! 보너스 EXP +${bonus}`, 'success');
    }
    
    if (game.player.streak > game.player.maxStreak) {
        game.player.maxStreak = game.player.streak;
    }
}

// 보스전 트리거
function triggerBossFight(boss) {
    game.isBossFight = true;
    game.selectedEntity = boss;
    
    addMessage(`🚨 보스 등장! ${boss.name}`, 'boss');
    addMessage(`💀 ${boss.description}`, 'info');
    addMessage(`⚡ F키를 눌러 필살기를 사용하세요!`, 'combat');
}

// 필살기 패널 열기 (보스전 전용)
function openUltimatePanel() {
    if (!game.isBossFight || !game.selectedEntity) {
        addMessage('⚡ 필살기는 보스전에서만 사용할 수 있습니다!', 'info');
        return;
    }
    
    game.isUltimateMode = true;
    const panel = document.getElementById('ultimatePanel');
    panel.style.display = 'block';
    
    const boss = game.selectedEntity;
    document.getElementById('hintBookCount').textContent = game.player.hintBook;
    document.getElementById('ultimateHint').textContent = `📚 보스의 약점: ${boss.weakness}`;
    
    addMessage(`🎯 대상: ${boss.name} (HP: ${boss.hp}/${boss.maxHp})`, 'combat');
    
    setTimeout(() => {
        document.getElementById('ultimatePrompt').focus();
    }, 100);
}

// 필살기 패널 닫기
function closeUltimatePanel() {
    document.getElementById('ultimatePanel').style.display = 'none';
    game.isUltimateMode = false;
}

// 필살기 사용
async function castUltimateSpell() {
    if (!game.selectedEntity) return;
    
    const prompt = document.getElementById('ultimatePrompt').value.trim();
    if (prompt.length < 10) {
        addMessage('⚠️ 최강 마법 주문이 너무 짧습니다! 더 상세하게 작성해주세요.', 'info');
        return;
    }
    
    closeUltimatePanel();
    addMessage('✨ 최강 마법 시전 중...', 'info');
    
    try {
        const localEval = evaluatePromptLocally(prompt, game.selectedEntity.name);
        let finalScore = localEval.score;
        
        // AI 평가 시도 (OpenRouter 직접 호출)
        try {
            const aiScore = await evaluateWithOpenRouter(prompt, game.selectedEntity.name, game.selectedEntity.description);
            if (aiScore !== null) {
                finalScore = Math.floor((localEval.score * 0.6) + (aiScore * 0.4));
                addMessage(`🤖 AI 평가: ${aiScore}%`, 'info');
            }
        } catch (error) {
            addMessage('🔍 AI 평가 연결 실패. 로컬 평가를 사용합니다.', 'info');
        }
        
        // 힌트북 사용 보너스
        if (game.player.hintBook > 0) {
            game.player.hintBook--;
            finalScore = Math.min(100, finalScore + 15);
            addMessage('📚 힌트북 사용! 마법 위력 증가!', 'loot');
        }
        
        // 최종 데미지 계산
        const baseDamage = 100 + (finalScore * 3);
        const finalDamage = baseDamage + Math.floor(Math.random() * 50);
        
        const entity = game.selectedEntity;
        entity.hp -= finalDamage;
        
        showDamage(entity.x, entity.y, finalDamage, false);
        addMessage(`⚡ 최강 마법 성공! ${finalScore}% 위력으로 ${finalDamage} 데미지!`, 'success');
        
        if (finalScore >= 80) {
            addMessage('🏆 전설적인 마법! 완벽한 시전입니다!', 'success');
        }
        
        game.player.lastPromptScore = finalScore;
        updateStats();
        
        if (entity.hp <= 0) {
            defeatEnemy(entity);
            game.isBossFight = false;
        } else {
            // 보스 반격
            const bossDamage = Math.max(5, entity.attack - game.player.defense + Math.floor(Math.random() * 10));
            game.player.hp -= bossDamage;
            showDamage(game.player.x, game.player.y, bossDamage, true);
            addMessage(`${entity.name}의 강력한 반격! -${bossDamage} HP`, 'combat');
            
            if (game.player.hp <= 0) {
                gameOver();
            }
            updateStats();
        }
        
    } catch (error) {
        addMessage('⚠️ 마법 시전 실패! 다시 시도해주세요.', 'info');
        console.error('Ultimate spell error:', error);
    }
}

// 적 처치
function defeatEnemy(enemy) {
    const index = game.entities.indexOf(enemy);
    game.entities.splice(index, 1);
    
    renderMap();
    
    game.player.exp += enemy.exp;
    game.killCount++;
    addMessage(`${enemy.name} 처치! +${enemy.exp} EXP`, 'success');
    
    if (game.player.exp >= game.player.maxExp) {
        levelUp();
    }
    
    game.selectedEntity = null;
    updateStats();
}

// 레벨업
function levelUp() {
    game.player.level++;
    game.player.exp -= game.player.maxExp;
    game.player.maxExp = Math.floor(game.player.maxExp * 1.2);
    
    const hpIncrease = 15 + Math.floor(Math.random() * 10);
    const attackIncrease = 2 + Math.floor(Math.random() * 3);
    const defenseIncrease = 1 + Math.floor(Math.random() * 2);
    
    game.player.maxHp += hpIncrease;
    game.player.hp += hpIncrease;
    game.player.attack += attackIncrease;
    game.player.defense += defenseIncrease;
    
    addMessage(`🆙 레벨 업! HP+${hpIncrease} ATK+${attackIncrease} DEF+${defenseIncrease}`, 'success');
    showLevelUpEffect();
    updateStats();
}

// 레벨업 이펙트
function showLevelUpEffect() {
    const effect = document.createElement('div');
    effect.className = 'levelup-effect active';
    effect.textContent = 'LEVEL UP!';
    document.body.appendChild(effect);
    
    setTimeout(() => {
        if (effect.parentNode) {
            effect.remove();
        }
    }, 1000);  // 더 빠른 레벨업 효과
}

// 상자 열기 (힌트북 아이템 포함)
function openChest(x, y) {
    game.map[y][x] = TILES.FLOOR;
    
    const loot = Math.random();
    if (loot < 0.25) {
        game.player.maxHp += 20;
        game.player.hp += 20;
        addMessage('💖 최대 체력 +20!', 'loot');
    } else if (loot < 0.45) {
        game.player.attack += 3;
        addMessage('⚔️ 공격력 +3!', 'loot');
    } else if (loot < 0.65) {
        game.player.defense += 2;
        addMessage('🛡️ 방어력 +2!', 'loot');
    } else if (loot < 0.85) {
        game.player.hintBook += 1;
        addMessage('📚 힌트북 획득! (보스전 필살기 위력 +15%)', 'loot');
        addMessage('💡 힌트북은 보스와 싸울 때 약점 정보를 제공합니다!', 'info');
    } else {
        // 마법 책 - 새로운 스펠 습득
        const availableSpells = ['meteor', 'lightning'];
        const unlearnedSpells = availableSpells.filter(spell => !game.player.spellsLearned.includes(spell));
        
        if (unlearnedSpells.length > 0) {
            const newSpell = unlearnedSpells[Math.floor(Math.random() * unlearnedSpells.length)];
            game.player.spellsLearned.push(newSpell);
            addMessage(`✨ 마법서 발견! ${SPELLS[newSpell].name} 마법을 습득했습니다!`, 'loot');
            addMessage(`🎯 ${SPELLS[newSpell].description}`, 'info');
        } else {
            game.player.maxMana += 10;
            game.manaPoints += 10;
            addMessage('💙 마나 수정! 최대 마나 +10!', 'loot');
        }
    }
    
    updateStats();
    renderMap();
}

// 다음 층
function nextFloor() {
    game.floor++;
    addMessage(`=== ${game.floor}층 진입 ===`, 'info');
    
    // 체력 회복
    game.player.hp = Math.min(game.player.maxHp, game.player.hp + 25);
    
    generateMap();
    renderMap();
    updateStats();
    
    if (game.floor % 5 === 0) {
        setTimeout(() => {
            const boss = game.entities.find(e => e.type === 'boss');
            if (boss) {
                addMessage(`🚨 ${game.floor}층 보스 등장!`, 'boss');
                addMessage('⚡ 필살기(F키)로 강력한 마법을 사용하세요!', 'combat');
            }
        }, 500);
    }
}

// 몬스터 이동
function moveMonsters() {
    game.entities.forEach(entity => {
        if (entity.type !== 'enemy') return;
        
        const dx = game.player.x - entity.x;
        const dy = game.player.y - entity.y;
        const distance = Math.abs(dx) + Math.abs(dy);
        
        if (distance <= 4 && distance > 1) {
            let moveX = 0, moveY = 0;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                moveX = dx > 0 ? 1 : -1;
            } else {
                moveY = dy > 0 ? 1 : -1;
            }
            
            const newX = entity.x + moveX;
            const newY = entity.y + moveY;
            
            if (game.map[newY][newX] === TILES.FLOOR && !isOccupied(newX, newY)) {
                entity.x = newX;
                entity.y = newY;
            }
        } else if (distance === 1) {
            // 플레이어에게 닿으면 자동으로 전투 시작
            startBattleMode(entity);
        }
    });
    
    renderMap();
}

// 데미지 표시
function showDamage(x, y, damage, isPlayerDamage) {
    const damageEl = document.createElement('div');
    damageEl.className = `damage-text ${isPlayerDamage ? 'player-damage' : 'enemy-damage'}`;
    damageEl.textContent = `-${damage}`;
    damageEl.style.left = (x * CELL_SIZE + 20) + 'px';
    damageEl.style.top = (y * CELL_SIZE) + 'px';
    
    document.getElementById('gameBoard').appendChild(damageEl);
    
    setTimeout(() => {
        if (damageEl.parentNode) {
            damageEl.remove();
        }
    }, 800);  // 더 빠른 데미지 텍스트 제거
}

// 게임 오버
function gameOver() {
    addMessage('💀 게임 오버!', 'combat');
    addMessage(`최종 기록: ${game.floor}층, ${game.killCount}마리 처치`, 'info');
    addMessage(`최고 연속 성공: ${game.player.maxStreak}회`, 'info');
    
    setTimeout(() => {
        if (confirm(`게임 오버!\n\n최종 기록:\n- 도달 층수: ${game.floor}층\n- 처치한 몬스터: ${game.killCount}마리\n- 최고 연속 성공: ${game.player.maxStreak}회\n- 최고 필살기 점수: ${game.maxPromptScore}%\n\n다시 시작하시겠습니까?`)) {
            location.reload();
        }
    }, 1000);
}

// 통계 업데이트
function updateStats() {
    document.getElementById('hp').textContent = game.player.hp;
    document.getElementById('maxHp').textContent = game.player.maxHp;
    document.getElementById('attack').textContent = game.player.attack;
    document.getElementById('defense').textContent = game.player.defense;
    document.getElementById('magic').textContent = game.player.hintBook;
    document.getElementById('level').textContent = game.player.level;
    document.getElementById('floor').textContent = game.floor;
    document.getElementById('mana').textContent = game.manaPoints;
    document.getElementById('maxMana').textContent = game.maxMana;
    
    const hpPercent = (game.player.hp / game.player.maxHp) * 100;
    document.getElementById('hpBar').style.width = hpPercent + '%';
    
    const expPercent = (game.player.exp / game.player.maxExp) * 100;
    document.getElementById('expBar').style.width = expPercent + '%';
    
    const manaPercent = (game.manaPoints / game.maxMana) * 100;
    document.getElementById('manaBar').style.width = manaPercent + '%';
    
    // 게임 상태 업데이트
    document.getElementById('gameModeDisplay').textContent = game.gameMode === 'explore' ? '탐험' : '전투';
    document.getElementById('selectedTarget').textContent = game.selectedEntity ? game.selectedEntity.name : '없음';
    document.getElementById('killCountDisplay').textContent = game.killCount;
    document.getElementById('maxScoreDisplay').textContent = game.maxPromptScore + '%';
}

// 커서 표시 업데이트
function updateCursorDisplay() {
    let cursor = document.getElementById('cursor');
    if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = 'cursor';
        cursor.className = 'cursor';
        document.getElementById('gameBoard').appendChild(cursor);
    }
    
    cursor.style.left = game.cursorX * CELL_SIZE + 'px';
    cursor.style.top = game.cursorY * CELL_SIZE + 'px';
    cursor.style.display = game.gameMode === 'combat' ? 'block' : 'none';
}

// 커서 이동
function moveCursor(dx, dy) {
    const newX = Math.max(0, Math.min(GRID_SIZE - 1, game.cursorX + dx));
    const newY = Math.max(0, Math.min(GRID_SIZE - 1, game.cursorY + dy));
    
    game.cursorX = newX;
    game.cursorY = newY;
    updateCursorDisplay();
    
    // 선택된 엔티티 업데이트
    game.selectedEntity = game.entities.find(e => e.x === newX && e.y === newY);
    updateStats();
}

// 게임 모드 전환
function toggleGameMode() {
    if (game.isBattleMode || game.isUltimateMode) return;
    
    game.gameMode = game.gameMode === 'explore' ? 'combat' : 'explore';
    updateCursorDisplay();
    updateStats();
    
    if (game.gameMode === 'combat') {
        addMessage('🎯 전투 모드: 커서로 대상을 선택하세요', 'info');
    } else {
        addMessage('🚶 탐험 모드: 이동하여 던전을 탐험하세요', 'info');
    }
}

// 메시지 추가
function addMessage(text, type = 'info') {
    const messageLog = document.getElementById('messageLog');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    messageLog.appendChild(message);
    messageLog.scrollTop = messageLog.scrollHeight;
    
    // 메시지 제한 (성능 최적화)
    const messages = messageLog.querySelectorAll('.message');
    if (messages.length > 100) {
        messages[0].remove();
    }
}

// 키보드 이벤트 리스너 설정
function setupEventListeners() {
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyUp);
    
    // 전투 선택지 클릭 이벤트 (키보드 전용이지만 접근성을 위해)
    document.querySelectorAll('.choice').forEach((choice, index) => {
        choice.addEventListener('click', () => {
            if (game.isBattleMode) {
                selectBattleChoice(index);
            }
        });
    });
}

// 키 입력 처리
function handleKeyPress(event) {
    if (game.isUltimateMode) {
        // 필살기 모드에서는 Enter와 ESC만 처리
        if (event.key === 'Enter') {
            event.preventDefault();
            castUltimateSpell();
        } else if (event.key === 'Escape') {
            closeUltimatePanel();
        }
        return;
    }
    
    if (game.isBattleMode) {
        // 전투 모드에서 숫자 키 처리
        const key = event.key;
        if (['1', '2', '3', '4'].includes(key)) {
            selectBattleChoice(parseInt(key) - 1);
        }
        return;
    }
    
    switch(event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (game.gameMode === 'explore') {
                movePlayer(0, -1);
            } else {
                moveCursor(0, -1);
            }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (game.gameMode === 'explore') {
                movePlayer(0, 1);
            } else {
                moveCursor(0, 1);
            }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (game.gameMode === 'explore') {
                movePlayer(-1, 0);
            } else {
                moveCursor(-1, 0);
            }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (game.gameMode === 'explore') {
                movePlayer(1, 0);
            } else {
                moveCursor(1, 0);
            }
            break;
        case ' ':
        case 'Enter':
            event.preventDefault();
            handleSpaceAction();
            break;
        case 'f':
        case 'F':
            // 보스전 필살기
            openUltimatePanel();
            break;
        case 't':
        case 'T':
            toggleGameMode();
            break;
        case 'q':
        case 'Q':
            castSpell('fireball');
            break;
        case '2':
            castSpell('meteor');
            break;
        case 'e':
        case 'E':
            castSpell('lightning');
            break;
        case 'r':
        case 'R':
            castSpell('heal');
            break;
    }
}

function handleKeyUp(event) {
    // 필요하면 키업 이벤트 처리
}

// 스페이스/엔터 액션 처리
function handleSpaceAction() {
    if (game.gameMode === 'combat' && game.selectedEntity && game.selectedEntity.type === 'enemy') {
        startBattleMode(game.selectedEntity);
    }
}

// 프롬프트 로컬 평가 함수 (prompt-evaluator.js와 연동)
function evaluatePromptLocally(prompt, monsterType) {
    if (typeof window.evaluatePromptLocally === 'function') {
        return window.evaluatePromptLocally(prompt, monsterType);
    }
    
    // 기본 평가 로직
    let score = Math.min(85, prompt.length + Math.floor(Math.random() * 30));
    return {
        score: score,
        effectiveness: score >= 80 ? 'legendary' : score >= 65 ? 'epic' : score >= 50 ? 'rare' : 'common',
        feedback: [`기본 평가: ${score}%`]
    };
}

// OpenRouter API 직접 호출 함수
async function evaluateWithOpenRouter(prompt, monsterName, monsterDescription) {
    try {
        const messages = [
            {
                role: 'system',
                content: `당신은 마법 전투 전문가입니다. 플레이어의 마법 주문을 평가하여 0-100점으로 점수를 매기세요.
                
평가 기준:
- 창의성과 논리적 사고 (30점)
- 몬스터 약점 활용 (25점)
- 구체적이고 단계별 설명 (25점)
- 마법적 이론과 현실성 (20점)

반드시 0-100 사이의 숫자만 반환하세요.`
            },
            {
                role: 'user',
                content: `몬스터: ${monsterName} (${monsterDescription})\n\n마법 주문: "${prompt}"`
            }
        ];
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': '마법소년 김씨의 던전 어드벤처'
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: messages,
                max_tokens: 50,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`OpenRouter API 오류: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content?.trim();
        
        // 숫자 추출
        const scoreMatch = aiResponse.match(/\d+/);
        if (scoreMatch) {
            const score = parseInt(scoreMatch[0]);
            return Math.min(100, Math.max(0, score));
        }
        
        return null;
    } catch (error) {
        console.error('OpenRouter API 오류:', error);
        return null;
    }
}

// AOE 스펠 시전 함수
function castSpell(spellKey) {
    if (game.isBattleMode || game.isUltimateMode || game.gameMode !== 'explore') {
        addMessage('⚠️ 탐험 모드에서만 마법을 사용할 수 있습니다!', 'info');
        return;
    }
    
    const spell = SPELLS[spellKey];
    if (!spell) return;
    
    // 스펠을 배웠는지 확인
    if (!game.player.spellsLearned.includes(spellKey)) {
        addMessage(`❌ ${spell.name} 마법을 아직 배우지 못했습니다!`, 'info');
        return;
    }
    
    // 마나 확인
    if (game.manaPoints < spell.manaCost) {
        addMessage(`💙 마나가 부족합니다! (필요: ${spell.manaCost}, 보유: ${game.manaPoints})`, 'info');
        return;
    }
    
    // 쿨다운 확인
    if (game.spellCooldowns[spellKey] > 0) {
        addMessage(`⏰ ${spell.name}는 ${game.spellCooldowns[spellKey]}초 후 사용 가능!`, 'info');
        return;
    }
    
    // 마나 소모 및 쿨다운 설정
    game.manaPoints -= spell.manaCost;
    game.spellCooldowns[spellKey] = spell.cooldown;
    
    // 스펠 효과 실행
    executeSpellEffect(spell, spellKey);
    
    // 쿨다운 타이머 시작
    startCooldownTimer(spellKey);
    
    updateStats();
}

// 스펠 효과 실행
function executeSpellEffect(spell, spellKey) {
    const playerX = game.player.x;
    const playerY = game.player.y;
    
    // 시전 메시지
    addMessage(`${spell.icon} ${spell.name} 시전!`, 'success');
    
    // 치유 마법
    if (spellKey === 'heal') {
        const healAmount = Math.abs(spell.damage);
        game.player.hp = Math.min(game.player.maxHp, game.player.hp + healAmount);
        showSpellEffect(playerX, playerY, `+${healAmount}`, 'heal');
        addMessage(`💚 체력 +${healAmount} 회복!`, 'success');
        return;
    }
    
    // 공격 마법
    let hitTargets = [];
    
    if (spell.aoe) {
        // AOE 스펠 (범위 공격)
        hitTargets = game.entities.filter(entity => {
            if (entity.type !== 'enemy' && entity.type !== 'boss') return false;
            const distance = Math.abs(entity.x - playerX) + Math.abs(entity.y - playerY);
            return distance <= spell.range;
        });
    } else if (spellKey === 'lightning') {
        // 번개는 직선 공격
        hitTargets = game.entities.filter(entity => {
            if (entity.type !== 'enemy' && entity.type !== 'boss') return false;
            return (entity.x === playerX || entity.y === playerY) &&
                   Math.abs(entity.x - playerX) + Math.abs(entity.y - playerY) <= spell.range;
        });
    }
    
    // 적들에게 데미지 적용
    hitTargets.forEach(target => {
        const damage = spell.damage + Math.floor(Math.random() * 20);
        target.hp -= damage;
        
        showSpellEffect(target.x, target.y, `-${damage}`, spellKey);
        
        if (target.hp <= 0) {
            setTimeout(() => defeatEnemy(target), 500);
        }
    });
    
    if (hitTargets.length > 0) {
        addMessage(`🎯 ${hitTargets.length}마리의 적에게 피해!`, 'combat');
    } else {
        addMessage('💨 범위 내에 적이 없습니다.', 'info');
    }
    
    // 스펠 시각 효과
    showSpellAnimation(playerX, playerY, spell, spellKey);
}

// 스펠 효과 표시
function showSpellEffect(x, y, text, type) {
    const effectEl = document.createElement('div');
    effectEl.className = `spell-effect spell-${type}`;
    effectEl.textContent = text;
    effectEl.style.left = (x * CELL_SIZE + 20) + 'px';
    effectEl.style.top = (y * CELL_SIZE - 10) + 'px';
    
    document.getElementById('gameBoard').appendChild(effectEl);
    
    setTimeout(() => {
        if (effectEl.parentNode) {
            effectEl.remove();
        }
    }, 1200);
}

// 스펠 애니메이션
function showSpellAnimation(x, y, spell, spellKey) {
    const animEl = document.createElement('div');
    animEl.className = `spell-animation spell-${spellKey}`;
    animEl.textContent = spell.icon;
    animEl.style.left = (x * CELL_SIZE + 10) + 'px';
    animEl.style.top = (y * CELL_SIZE + 10) + 'px';
    
    document.getElementById('gameBoard').appendChild(animEl);
    
    setTimeout(() => {
        if (animEl.parentNode) {
            animEl.remove();
        }
    }, 800);
}

// 쿨다운 타이머 시작
function startCooldownTimer(spellKey) {
    const interval = setInterval(() => {
        game.spellCooldowns[spellKey]--;
        
        if (game.spellCooldowns[spellKey] <= 0) {
            clearInterval(interval);
            addMessage(`✨ ${SPELLS[spellKey].name} 준비 완료!`, 'success');
        }
    }, 1000);
}

// 마나 재생 시스템
function startManaRegeneration() {
    setInterval(() => {
        if (game.manaPoints < game.maxMana) {
            game.manaPoints = Math.min(game.maxMana, game.manaPoints + 1);
            updateStats();
        }
    }, 2000); // 2초마다 마나 1 회복
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    init();
    startManaRegeneration();
});