// 마법소년 김씨의 던전 어드벤처 - Enhanced with Item System
// 게임 상수
const GRID_SIZE = 15;
const CELL_SIZE = 40;

// OpenRouter API 설정
const OPENROUTER_API_KEY = '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';
const OPENROUTER_MODEL = 'gpt-3.5-turbo';

// 아이템 등급
const ITEM_RARITY = {
    COMMON: { name: '일반', color: '#808080', multiplier: 1 },
    UNCOMMON: { name: '고급', color: '#1eff00', multiplier: 1.2 },
    RARE: { name: '희귀', color: '#0070ff', multiplier: 1.5 },
    EPIC: { name: '영웅', color: '#a335ee', multiplier: 2 },
    LEGENDARY: { name: '전설', color: '#ff8000', multiplier: 3 },
    MYTHIC: { name: '신화', color: '#ff00ff', multiplier: 5 }
};

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
        gold: 100,
        inventory: [],
        maxInventory: 20,
        equipment: {
            weapon: null,
            armor: null,
            accessory: null
        },
        craftingMaterials: {
            essences: 10,
            crystals: 5,
            scrolls: 2
        },
        enhancementHistory: [],
        totalEnhancements: 0,
        hintBook: 0,
        lastPromptScore: 0,
        streak: 0,
        maxStreak: 0,
        spellsLearned: ['fireball', 'heal'],
        totalKills: 0,
        criticalChance: 5,
        criticalDamage: 150,
        buffs: [],
        skillPoints: 0
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
    itemForge: {
        isOpen: false,
        selectedItem: null,
        enhancementLevel: 0
    },
    dungeonShop: {
        isOpen: false,
        items: []
    }
};

// 타일 타입
const TILES = {
    FLOOR: 0,
    WALL: 1,
    DOOR: 2,
    CHEST: 3,
    STAIRS: 4,
    FORGE: 5,
    SHOP: 6
};

// 아이템 타입
const ITEM_TYPES = {
    WEAPON: {
        name: '무기',
        slot: 'weapon',
        baseStats: ['attack'],
        prefixes: ['날카로운', '강력한', '치명적인', '파괴의', '전설의'],
        items: [
            { name: '녹슨 검', attack: 5, icon: '⚔️' },
            { name: '마법 지팡이', attack: 8, magic: 3, icon: '🎯' },
            { name: '전투 도끼', attack: 12, icon: '🪓' },
            { name: '아크 스태프', attack: 6, magic: 6, icon: '🪄' },
            { name: '룬 검', attack: 15, criticalChance: 5, icon: '🌙' }
        ]
    },
    ARMOR: {
        name: '방어구',
        slot: 'armor',
        baseStats: ['defense', 'hp'],
        prefixes: ['단단한', '강철의', '불굴의', '수호의', '방어의'],
        items: [
            { name: '가죽 갑옷', defense: 3, hp: 10, icon: '🎽' },
            { name: '철 갑옷', defense: 5, hp: 20, icon: '🛡️' },
            { name: '마법 로브', defense: 4, magic: 5, hp: 15, icon: '🧥' },
            { name: '용비늘 갑옷', defense: 8, hp: 35, icon: '🐉' },
            { name: '성기사 갑옷', defense: 7, hp: 30, magic: 3, icon: '✨' }
        ]
    },
    ACCESSORY: {
        name: '액세서리',
        slot: 'accessory',
        baseStats: ['various'],
        prefixes: ['빛나는', '마법의', '행운의', '지혜의', '신비한'],
        items: [
            { name: '힘의 반지', attack: 3, icon: '💍' },
            { name: '보호의 목걸이', defense: 3, icon: '🔔' },
            { name: '마나 크리스탈', magic: 8, mana: 20, icon: '🔮' },
            { name: '빠른 부츠', dexterity: 5, icon: '👢' },
            { name: '생명의 벨트', hp: 50, icon: '🩹' }
        ]
    }
};

// 강화 레벨별 요구사항
const ENHANCEMENT_REQUIREMENTS = [
    { level: 1, essences: 5, crystals: 0, scrolls: 0, gold: 100, successRate: 90 },
    { level: 2, essences: 10, crystals: 2, scrolls: 0, gold: 200, successRate: 80 },
    { level: 3, essences: 15, crystals: 5, scrolls: 1, gold: 400, successRate: 70 },
    { level: 4, essences: 20, crystals: 8, scrolls: 2, gold: 800, successRate: 60 },
    { level: 5, essences: 30, crystals: 12, scrolls: 3, gold: 1600, successRate: 50 },
    { level: 6, essences: 40, crystals: 16, scrolls: 5, gold: 3200, successRate: 40 },
    { level: 7, essences: 50, crystals: 20, scrolls: 7, gold: 6400, successRate: 30 },
    { level: 8, essences: 70, crystals: 25, scrolls: 10, gold: 12800, successRate: 20 },
    { level: 9, essences: 90, crystals: 30, scrolls: 15, gold: 25600, successRate: 15 },
    { level: 10, essences: 120, crystals: 40, scrolls: 20, gold: 51200, successRate: 10 }
];

// 스펠 데이터
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
        damage: -30,
        range: 0,
        aoe: false,
        description: '체력 회복'
    }
};

// 몬스터 데이터
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

// 아이템 생성 함수
function generateRandomItem(typeKey, rarityLevel = 0) {
    const type = ITEM_TYPES[typeKey];
    if (!type) return null;
    
    const baseItem = type.items[Math.floor(Math.random() * type.items.length)];
    const rarityKeys = Object.keys(ITEM_RARITY);
    const rarityIndex = Math.min(rarityKeys.length - 1, Math.floor(Math.random() * 3) + rarityLevel);
    const rarity = ITEM_RARITY[rarityKeys[rarityIndex]];
    
    const item = {
        ...baseItem,
        id: Date.now() + Math.random(),
        type: typeKey,
        rarity: rarityKeys[rarityIndex],
        enhancementLevel: 0,
        prefix: type.prefixes[Math.floor(Math.random() * type.prefixes.length)],
        baseStats: { ...baseItem }
    };
    
    // 희귀도에 따른 스탯 보정
    Object.keys(item.baseStats).forEach(stat => {
        if (typeof item.baseStats[stat] === 'number') {
            item[stat] = Math.floor(item.baseStats[stat] * rarity.multiplier);
        }
    });
    
    return item;
}

// 아이템 장착
function equipItem(item) {
    if (!item || !item.type) return;
    
    const type = ITEM_TYPES[item.type];
    if (!type) return;
    
    // 기존 장비 해제
    const oldItem = game.player.equipment[type.slot];
    if (oldItem) {
        unequipItem(oldItem);
        game.player.inventory.push(oldItem);
    }
    
    // 새 아이템 장착
    game.player.equipment[type.slot] = item;
    
    // 스탯 적용
    Object.keys(item).forEach(stat => {
        if (typeof item[stat] === 'number' && stat !== 'id' && stat !== 'enhancementLevel') {
            if (game.player[stat] !== undefined) {
                game.player[stat] += item[stat];
            } else if (stat === 'hp') {
                game.player.maxHp += item[stat];
                game.player.hp += item[stat];
            } else if (stat === 'mana') {
                game.maxMana += item[stat];
                game.manaPoints += item[stat];
            } else if (stat === 'magic') {
                game.player.attack += Math.floor(item[stat] / 2);
            }
        }
    });
    
    // 인벤토리에서 제거
    const index = game.player.inventory.indexOf(item);
    if (index > -1) {
        game.player.inventory.splice(index, 1);
    }
    
    const rarityInfo = ITEM_RARITY[item.rarity];
    addMessage(`🎮 <span style="color: ${rarityInfo.color}">[${rarityInfo.name}] ${item.prefix} ${item.name}(+${item.enhancementLevel})</span> 장착!`, 'loot');
    updateStats();
}

// 아이템 해제
function unequipItem(item) {
    if (!item) return;
    
    // 스탯 제거
    Object.keys(item).forEach(stat => {
        if (typeof item[stat] === 'number' && stat !== 'id' && stat !== 'enhancementLevel') {
            if (game.player[stat] !== undefined) {
                game.player[stat] -= item[stat];
            } else if (stat === 'hp') {
                game.player.maxHp -= item[stat];
                game.player.hp = Math.min(game.player.hp, game.player.maxHp);
            } else if (stat === 'mana') {
                game.maxMana -= item[stat];
                game.manaPoints = Math.min(game.manaPoints, game.maxMana);
            } else if (stat === 'magic') {
                game.player.attack -= Math.floor(item[stat] / 2);
            }
        }
    });
}

// 아이템 강화 창 열기
function openItemForge() {
    game.itemForge.isOpen = true;
    const panel = document.getElementById('forgePanel');
    panel.style.display = 'block';
    
    updateForgeUI();
    addMessage('🔨 아이템 강화소에 오신 것을 환영합니다!', 'info');
    addMessage('📝 프롬프트를 잘 작성하면 강화 성공률이 올라갑니다!', 'info');
}

// 아이템 강화 창 닫기
function closeItemForge() {
    game.itemForge.isOpen = false;
    document.getElementById('forgePanel').style.display = 'none';
}

// 강화 UI 업데이트
function updateForgeUI() {
    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = '';
    
    game.player.inventory.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        const rarityInfo = ITEM_RARITY[item.rarity];
        itemDiv.innerHTML = `
            <span style="color: ${rarityInfo.color}">
                ${item.icon} [${rarityInfo.name}] ${item.prefix} ${item.name}(+${item.enhancementLevel})
            </span>
            <button onclick="selectItemForEnhancement(${index})">선택</button>
        `;
        inventoryList.appendChild(itemDiv);
    });
    
    // 재료 표시
    document.getElementById('essenceCount').textContent = game.player.craftingMaterials.essences;
    document.getElementById('crystalCount').textContent = game.player.craftingMaterials.crystals;
    document.getElementById('scrollCount').textContent = game.player.craftingMaterials.scrolls;
    document.getElementById('goldCount').textContent = game.player.gold;
}

// 강화할 아이템 선택
function selectItemForEnhancement(index) {
    const item = game.player.inventory[index];
    if (!item) return;
    
    game.itemForge.selectedItem = item;
    const nextLevel = item.enhancementLevel + 1;
    
    if (nextLevel > 10) {
        addMessage('❌ 이 아이템은 최대 강화 레벨입니다!', 'info');
        return;
    }
    
    const req = ENHANCEMENT_REQUIREMENTS[nextLevel - 1];
    document.getElementById('selectedItemInfo').innerHTML = `
        <h3>선택된 아이템</h3>
        <p style="color: ${ITEM_RARITY[item.rarity].color}">
            ${item.icon} ${item.prefix} ${item.name}(+${item.enhancementLevel} → +${nextLevel})
        </p>
        <p>필요 재료:</p>
        <ul>
            <li>정수: ${req.essences}</li>
            <li>크리스탈: ${req.crystals}</li>
            <li>주문서: ${req.scrolls}</li>
            <li>골드: ${req.gold}</li>
        </ul>
        <p>기본 성공률: ${req.successRate}%</p>
    `;
    
    document.getElementById('enhanceButton').style.display = 'block';
}

// 아이템 강화 실행
async function enhanceItem() {
    const item = game.itemForge.selectedItem;
    if (!item) return;
    
    const nextLevel = item.enhancementLevel + 1;
    const req = ENHANCEMENT_REQUIREMENTS[nextLevel - 1];
    
    // 재료 확인
    if (game.player.craftingMaterials.essences < req.essences ||
        game.player.craftingMaterials.crystals < req.crystals ||
        game.player.craftingMaterials.scrolls < req.scrolls ||
        game.player.gold < req.gold) {
        addMessage('❌ 재료가 부족합니다!', 'info');
        return;
    }
    
    const prompt = document.getElementById('enhancementPrompt').value.trim();
    if (prompt.length < 10) {
        addMessage('⚠️ 강화 주문이 너무 짧습니다! 더 상세하게 작성해주세요.', 'info');
        return;
    }
    
    // 재료 소모
    game.player.craftingMaterials.essences -= req.essences;
    game.player.craftingMaterials.crystals -= req.crystals;
    game.player.craftingMaterials.scrolls -= req.scrolls;
    game.player.gold -= req.gold;
    
    addMessage('🔮 강화 시전 중...', 'info');
    
    try {
        // 프롬프트 평가
        let promptBonus = 0;
        
        // 로컬 평가
        if (prompt.includes(item.name)) promptBonus += 10;
        if (prompt.includes('마법') || prompt.includes('주문')) promptBonus += 5;
        if (prompt.includes('강화') || prompt.includes('힘')) promptBonus += 5;
        if (prompt.length > 50) promptBonus += 10;
        if (prompt.includes(item.prefix)) promptBonus += 15;
        
        // AI 평가 시도
        try {
            const aiScore = await evaluateEnhancementPrompt(prompt, item);
            if (aiScore !== null) {
                promptBonus = Math.floor((promptBonus + aiScore) / 2);
                addMessage(`🤖 AI 평가 보너스: +${promptBonus}%`, 'info');
            }
        } catch (error) {
            console.log('AI 평가 실패, 로컬 평가 사용');
        }
        
        const finalSuccessRate = Math.min(100, req.successRate + promptBonus);
        const roll = Math.random() * 100;
        
        if (roll < finalSuccessRate) {
            // 강화 성공
            item.enhancementLevel = nextLevel;
            
            // 스탯 증가
            Object.keys(item.baseStats).forEach(stat => {
                if (typeof item.baseStats[stat] === 'number') {
                    const increase = Math.floor(item.baseStats[stat] * 0.2);
                    item[stat] += increase;
                }
            });
            
            addMessage(`✨ 강화 성공! ${item.name}이(가) +${nextLevel}로 강화되었습니다!`, 'success');
            
            // 특별 효과
            if (nextLevel === 5) {
                addMessage('🌟 +5 강화 달성! 특별한 빛이 아이템을 감싸고 있습니다!', 'success');
            } else if (nextLevel === 10) {
                addMessage('💎 +10 강화 달성! 전설적인 아이템이 탄생했습니다!', 'success');
            }
            
            game.player.totalEnhancements++;
            game.player.enhancementHistory.push({
                item: item.name,
                level: nextLevel,
                success: true,
                prompt: prompt
            });
        } else {
            // 강화 실패
            addMessage(`💔 강화 실패! ${item.name}의 강화가 실패했습니다.`, 'combat');
            
            // 높은 레벨에서 실패 시 강화 레벨 감소
            if (nextLevel > 7 && Math.random() < 0.3) {
                item.enhancementLevel = Math.max(0, item.enhancementLevel - 1);
                addMessage(`⚠️ 강화 레벨이 감소했습니다! (${item.enhancementLevel + 1} → ${item.enhancementLevel})`, 'combat');
            }
            
            game.player.enhancementHistory.push({
                item: item.name,
                level: nextLevel,
                success: false,
                prompt: prompt
            });
        }
        
    } catch (error) {
        addMessage('⚠️ 강화 시전 실패! 다시 시도해주세요.', 'info');
        console.error('Enhancement error:', error);
    }
    
    updateForgeUI();
    updateStats();
}

// 강화 프롬프트 AI 평가
async function evaluateEnhancementPrompt(prompt, item) {
    try {
        const messages = [
            {
                role: 'system',
                content: `당신은 아이템 강화 전문가입니다. 플레이어의 강화 주문을 평가하여 0-50점의 보너스 점수를 부여하세요.
                
평가 기준:
- 아이템과의 연관성 (15점)
- 창의성과 상상력 (15점)
- 구체적인 묘사 (10점)
- 마법적 분위기 (10점)

반드시 0-50 사이의 숫자만 반환하세요.`
            },
            {
                role: 'user',
                content: `아이템: ${item.prefix} ${item.name}\n강화 주문: "${prompt}"`
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
        
        const scoreMatch = aiResponse.match(/\d+/);
        if (scoreMatch) {
            const score = parseInt(scoreMatch[0]);
            return Math.min(50, Math.max(0, score));
        }
        
        return null;
    } catch (error) {
        console.error('OpenRouter API 오류:', error);
        return null;
    }
}

// 게임 초기화
function init() {
    generateMap();
    renderMap();
    updateStats();
    setupEventListeners();
    showGameIntro();
    
    // 시작 아이템 지급
    const startWeapon = generateRandomItem('WEAPON', 0);
    const startArmor = generateRandomItem('ARMOR', 0);
    
    if (startWeapon) game.player.inventory.push(startWeapon);
    if (startArmor) game.player.inventory.push(startArmor);
    
    addMessage('🎁 시작 장비를 획득했습니다! 인벤토리(I)를 확인하세요!', 'loot');
}

// 게임 인트로
function showGameIntro() {
    addMessage('✨ 마법소년 김씨의 던전 어드벤처 - Enhanced Edition', 'welcome');
    addMessage('', 'info');
    addMessage('🏠 평범한 직장인 김소년이 마법의 세계로 소환되었습니다!', 'info');
    addMessage('🔨 이제 아이템을 수집하고 강화하여 더 강해질 수 있습니다!', 'info');
    addMessage('', 'info');
    addMessage('🎮 조작법:', 'welcome');
    addMessage('⬆️ WASD/화살표: 이동', 'info');
    addMessage('🎒 I키: 인벤토리', 'info');
    addMessage('🔨 G키: 강화소', 'info');
    addMessage('🛍️ B키: 상점', 'info');
    addMessage('⚡ F키: 보스전 필살기', 'info');
    addMessage('🔢 1,2,3,4: 전투 중 선택', 'info');
    addMessage('', 'info');
    addMessage('💡 프롬프트를 잘 작성하면 강화 성공률이 올라갑니다!', 'loot');
}

// 맵 생성 (강화소와 상점 추가)
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
    
    // 강화소 배치 (매 3층마다)
    if (game.floor % 3 === 0 && rooms.length > 2) {
        const forgeRoom = rooms[1];
        const forgeX = Math.floor(forgeRoom.x + forgeRoom.w / 2);
        const forgeY = Math.floor(forgeRoom.y + forgeRoom.h / 2);
        game.map[forgeY][forgeX] = TILES.FORGE;
    }
    
    // 상점 배치 (매 5층마다)
    if (game.floor % 5 === 0 && rooms.length > 3) {
        const shopRoom = rooms[2];
        const shopX = Math.floor(shopRoom.x + shopRoom.w / 2);
        const shopY = Math.floor(shopRoom.y + shopRoom.h / 2);
        game.map[shopY][shopX] = TILES.SHOP;
    }
    
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
    
    const startX = Math.min(x1, x2);
    const endX = Math.max(x1, x2);
    for (let x = startX; x <= endX; x++) {
        game.map[y1][x] = TILES.FLOOR;
    }
    
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

// 상자 배치
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
                case TILES.FORGE:
                    cell.classList.add('forge');
                    cell.textContent = '🔨';
                    break;
                case TILES.SHOP:
                    cell.classList.add('shop');
                    cell.textContent = '🛍️';
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
    
    // 강화소 확인
    if (game.map[newY][newX] === TILES.FORGE) {
        openItemForge();
        return;
    }
    
    // 상점 확인
    if (game.map[newY][newX] === TILES.SHOP) {
        openShop();
        return;
    }
    
    game.isMoving = true;
    game.player.x = newX;
    game.player.y = newY;
    
    updatePlayerPosition();
    
    setTimeout(() => {
        moveMonsters();
        game.isMoving = false;
    }, 200);
}

// 플레이어 위치 업데이트
function updatePlayerPosition() {
    const player = document.getElementById('player');
    player.style.left = game.player.x * CELL_SIZE + 'px';
    player.style.top = game.player.y * CELL_SIZE + 'px';
}

// 객관식 전투 시작
function startBattleMode(enemy) {
    game.isBattleMode = true;
    game.selectedEntity = enemy;
    game.currentBattleData = enemy;
    game.battleTimer = game.battleTimeLimit;
    
    const battlePanel = document.getElementById('battlePanel');
    battlePanel.style.display = 'block';
    
    document.getElementById('questionText').textContent = enemy.question;
    document.getElementById('battleHint').textContent = `💡 ${enemy.hint}`;
    
    const choices = document.querySelectorAll('.choice');
    choices.forEach((choice, index) => {
        choice.classList.remove('selected', 'correct', 'wrong');
        choice.querySelector('.choice-text').textContent = enemy.choices[index].text;
        choice.querySelector('.choice-result').textContent = '';
    });
    
    addMessage(`⚔️ ${enemy.name}과의 전투! 빠르게 선택하세요!`, 'combat');
    
    startBattleTimer();
}

// 전투 타이머 시작
function startBattleTimer() {
    const timerInterval = setInterval(() => {
        game.battleTimer--;
        document.getElementById('battleTimer').textContent = game.battleTimer;
        
        if (game.battleTimer <= 0) {
            clearInterval(timerInterval);
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
    
    choiceElements[choiceIndex].classList.add('selected');
    
    setTimeout(() => {
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
        
        const damage = choice.damage + Math.floor(Math.random() * 20);
        enemy.hp -= damage;
        
        showDamage(enemy.x, enemy.y, damage, false);
        
        if (choice.correct) {
            game.player.streak++;
            addMessage(`🎯 정답! ${enemy.name}에게 ${damage} 데미지!`, 'success');
        } else {
            game.player.streak = 0;
            addMessage(`💥 ${enemy.name}에게 ${damage} 데미지!`, 'combat');
        }
        
        setTimeout(() => {
            if (enemy.hp <= 0) {
                defeatEnemy(enemy);
            } else {
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

// 보스전 트리거
function triggerBossFight(boss) {
    game.isBossFight = true;
    game.selectedEntity = boss;
    
    addMessage(`🚨 보스 등장! ${boss.name}`, 'boss');
    addMessage(`💀 ${boss.description}`, 'info');
    addMessage(`⚡ F키를 눌러 필살기를 사용하세요!`, 'combat');
}

// 필살기 패널 열기
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
        addMessage('⚠️ 최강 마법 주문이 너무 짧습니다!', 'info');
        return;
    }
    
    closeUltimatePanel();
    addMessage('✨ 최강 마법 시전 중...', 'info');
    
    try {
        let finalScore = 50 + Math.floor(Math.random() * 30);
        
        // AI 평가 시도
        try {
            const aiScore = await evaluateWithOpenRouter(prompt, game.selectedEntity.name, game.selectedEntity.description);
            if (aiScore !== null) {
                finalScore = aiScore;
                addMessage(`🤖 AI 평가: ${aiScore}%`, 'info');
            }
        } catch (error) {
            addMessage('🔍 AI 평가 연결 실패. 로컬 평가를 사용합니다.', 'info');
        }
        
        if (game.player.hintBook > 0) {
            game.player.hintBook--;
            finalScore = Math.min(100, finalScore + 15);
            addMessage('📚 힌트북 사용! 마법 위력 증가!', 'loot');
        }
        
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
        addMessage('⚠️ 마법 시전 실패!', 'info');
        console.error('Ultimate spell error:', error);
    }
}

// OpenRouter API 호출
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

// 적 처치
function defeatEnemy(enemy) {
    const index = game.entities.indexOf(enemy);
    game.entities.splice(index, 1);
    
    renderMap();
    
    game.player.exp += enemy.exp;
    game.killCount++;
    game.player.totalKills++;
    
    // 골드 드롭
    const goldAmount = Math.floor((enemy.exp / 2) + Math.random() * enemy.exp);
    game.player.gold += goldAmount;
    addMessage(`${enemy.name} 처치! +${enemy.exp} EXP, +${goldAmount} 골드`, 'success');
    
    // 재료 드롭
    const dropChance = Math.random();
    if (dropChance < 0.3) {
        game.player.craftingMaterials.essences += Math.floor(Math.random() * 3) + 1;
        addMessage('🌌 정수 획득!', 'loot');
    }
    if (dropChance < 0.15) {
        game.player.craftingMaterials.crystals += 1;
        addMessage('💎 크리스탈 획득!', 'loot');
    }
    if (dropChance < 0.05) {
        game.player.craftingMaterials.scrolls += 1;
        addMessage('📜 강화 주문서 획득!', 'loot');
    }
    
    // 아이템 드롭 (10% 확률)
    if (Math.random() < 0.1) {
        const itemTypes = ['WEAPON', 'ARMOR', 'ACCESSORY'];
        const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        const item = generateRandomItem(itemType, enemy.type === 'boss' ? 2 : 0);
        
        if (item && game.player.inventory.length < game.player.maxInventory) {
            game.player.inventory.push(item);
            const rarityInfo = ITEM_RARITY[item.rarity];
            addMessage(`🎁 <span style="color: ${rarityInfo.color}">[${rarityInfo.name}] ${item.prefix} ${item.name}</span> 획득!`, 'loot');
        }
    }
    
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
    }, 1000);
}

// 상자 열기
function openChest(x, y) {
    game.map[y][x] = TILES.FLOOR;
    
    // 골드 획득
    const goldAmount = 50 + Math.floor(Math.random() * 100) * game.floor;
    game.player.gold += goldAmount;
    addMessage(`💰 ${goldAmount} 골드 획득!`, 'loot');
    
    // 재료 획득
    game.player.craftingMaterials.essences += Math.floor(Math.random() * 5) + 3;
    game.player.craftingMaterials.crystals += Math.floor(Math.random() * 3) + 1;
    if (Math.random() < 0.3) {
        game.player.craftingMaterials.scrolls += 1;
        addMessage('📜 강화 주문서 획득!', 'loot');
    }
    
    const loot = Math.random();
    if (loot < 0.2) {
        game.player.maxHp += 20;
        game.player.hp += 20;
        addMessage('💖 최대 체력 +20!', 'loot');
    } else if (loot < 0.35) {
        game.player.attack += 3;
        addMessage('⚔️ 공격력 +3!', 'loot');
    } else if (loot < 0.5) {
        game.player.defense += 2;
        addMessage('🛡️ 방어력 +2!', 'loot');
    } else if (loot < 0.65) {
        game.player.hintBook += 1;
        addMessage('📚 힌트북 획득! (보스전 필살기 위력 +15%)', 'loot');
    } else if (loot < 0.85) {
        // 아이템 획득
        const itemTypes = ['WEAPON', 'ARMOR', 'ACCESSORY'];
        const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        const item = generateRandomItem(itemType, Math.floor(game.floor / 5));
        
        if (item && game.player.inventory.length < game.player.maxInventory) {
            game.player.inventory.push(item);
            const rarityInfo = ITEM_RARITY[item.rarity];
            addMessage(`🎁 <span style="color: ${rarityInfo.color}">[${rarityInfo.name}] ${item.prefix} ${item.name}</span> 획득!`, 'loot');
        }
    } else {
        // 마법 책
        game.manaPoints = game.maxMana;
        addMessage('💙 마나 완전 회복!', 'loot');
    }
    
    updateStats();
    renderMap();
}

// 다음 층
function nextFloor() {
    game.floor++;
    addMessage(`=== ${game.floor}층 진입 ===`, 'info');
    
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
    
    if (game.floor % 3 === 0) {
        addMessage('🔨 강화소가 이 층에 있습니다!', 'info');
    }
    
    if (game.floor % 5 === 0) {
        addMessage('🛍️ 상점이 이 층에 있습니다!', 'info');
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
    }, 800);
}

// 인벤토리 열기
function openInventory() {
    const panel = document.getElementById('inventoryPanel');
    panel.style.display = 'block';
    
    const inventoryContent = document.getElementById('inventoryContent');
    inventoryContent.innerHTML = '<h3>인벤토리</h3>';
    
    // 장착된 아이템 표시
    inventoryContent.innerHTML += '<h4>장착 중</h4>';
    ['weapon', 'armor', 'accessory'].forEach(slot => {
        const item = game.player.equipment[slot];
        if (item) {
            const rarityInfo = ITEM_RARITY[item.rarity];
            inventoryContent.innerHTML += `
                <div class="equipped-item">
                    <span style="color: ${rarityInfo.color}">
                        ${item.icon} [${slot}] ${item.prefix} ${item.name}(+${item.enhancementLevel})
                    </span>
                </div>
            `;
        }
    });
    
    // 인벤토리 아이템 표시
    inventoryContent.innerHTML += '<h4>보관 중</h4>';
    game.player.inventory.forEach((item, index) => {
        const rarityInfo = ITEM_RARITY[item.rarity];
        inventoryContent.innerHTML += `
            <div class="inventory-item">
                <span style="color: ${rarityInfo.color}">
                    ${item.icon} ${item.prefix} ${item.name}(+${item.enhancementLevel})
                </span>
                <button onclick="equipItem(game.player.inventory[${index}])">장착</button>
            </div>
        `;
    });
}

// 인벤토리 닫기
function closeInventory() {
    document.getElementById('inventoryPanel').style.display = 'none';
}

// 상점 열기
function openShop() {
    addMessage('🛍️ 상점은 준비 중입니다!', 'info');
}

// 게임 오버
function gameOver() {
    addMessage('💀 게임 오버!', 'combat');
    addMessage(`최종 기록: ${game.floor}층, ${game.killCount}마리 처치`, 'info');
    addMessage(`총 강화 횟수: ${game.player.totalEnhancements}회`, 'info');
    
    setTimeout(() => {
        if (confirm(`게임 오버!\n\n최종 기록:\n- 도달 층수: ${game.floor}층\n- 처치한 몬스터: ${game.killCount}마리\n- 강화 성공: ${game.player.totalEnhancements}회\n\n다시 시작하시겠습니까?`)) {
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
    document.getElementById('level').textContent = game.player.level;
    document.getElementById('floor').textContent = game.floor;
    document.getElementById('gold').textContent = game.player.gold;
    
    const hpPercent = (game.player.hp / game.player.maxHp) * 100;
    document.getElementById('hpBar').style.width = hpPercent + '%';
    
    const expPercent = (game.player.exp / game.player.maxExp) * 100;
    document.getElementById('expBar').style.width = expPercent + '%';
}

// 메시지 추가
function addMessage(text, type = 'info') {
    const messageLog = document.getElementById('messageLog');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = text;
    
    messageLog.appendChild(message);
    messageLog.scrollTop = messageLog.scrollHeight;
    
    const messages = messageLog.querySelectorAll('.message');
    if (messages.length > 100) {
        messages[0].remove();
    }
}

// 키보드 이벤트 리스너 설정
function setupEventListeners() {
    document.addEventListener('keydown', handleKeyPress);
    
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
        if (event.key === 'Enter') {
            event.preventDefault();
            castUltimateSpell();
        } else if (event.key === 'Escape') {
            closeUltimatePanel();
        }
        return;
    }
    
    if (game.itemForge.isOpen) {
        if (event.key === 'Escape' || event.key === 'g' || event.key === 'G') {
            closeItemForge();
        }
        return;
    }
    
    if (document.getElementById('inventoryPanel').style.display === 'block') {
        if (event.key === 'Escape' || event.key === 'i' || event.key === 'I') {
            closeInventory();
        }
        return;
    }
    
    if (game.isBattleMode) {
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
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            movePlayer(1, 0);
            break;
        case 'f':
        case 'F':
            openUltimatePanel();
            break;
        case 'i':
        case 'I':
            openInventory();
            break;
        case 'g':
        case 'G':
            if (game.map[game.player.y][game.player.x] === TILES.FORGE) {
                openItemForge();
            } else {
                addMessage('🔨 강화소에서만 사용할 수 있습니다!', 'info');
            }
            break;
        case 'b':
        case 'B':
            if (game.map[game.player.y][game.player.x] === TILES.SHOP) {
                openShop();
            } else {
                addMessage('🛍️ 상점에서만 사용할 수 있습니다!', 'info');
            }
            break;
    }
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    init();
});