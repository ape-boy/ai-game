// boss.js - 보스 시스템

// 보스 데이터
const BOSSES = {
    5: {
        icon: '🐉',
        name: '불의 드래곤',
        hp: 200,
        attack: 25,
        exp: 200,
        weakness: '얼음',
        description: '화염을 내뿜는 거대한 드래곤입니다. 얼음 마법에 약합니다.',
        specialAttack: '화염 브레스',
        loot: {
            potions: 1,
            scrolls: 1,
            thunderSpells: 0.5,
            iceSpells: 0.8
        }
    },
    10: {
        icon: '🗿',
        name: '얼음 골렘',
        hp: 300,
        attack: 30,
        exp: 300,
        weakness: '화염',
        description: '극지의 얼음으로 만들어진 거대한 골렘. 화염 마법이 효과적입니다.',
        specialAttack: '절대 영도',
        loot: {
            potions: 1,
            scrolls: 1,
            thunderSpells: 0.8,
            iceSpells: 0.5
        }
    },
    15: {
        icon: '👾',
        name: '어둠의 마왕',
        hp: 400,
        attack: 35,
        exp: 400,
        weakness: '빛',
        description: '어둠의 힘을 다루는 마왕. 신성한 빛의 마법에 취약합니다.',
        specialAttack: '어둠의 저주',
        loot: {
            potions: 1,
            scrolls: 2,
            thunderSpells: 1,
            iceSpells: 1
        }
    },
    20: {
        icon: '💀',
        name: '고대 리치',
        hp: 500,
        attack: 40,
        exp: 500,
        weakness: '생명',
        description: '죽음을 초월한 언데드 마법사. 생명과 치유의 힘이 필요합니다.',
        specialAttack: '죽음의 손길',
        loot: {
            potions: 2,
            scrolls: 2,
            thunderSpells: 1,
            iceSpells: 1
        }
    },
    25: {
        icon: '🌀',
        name: '혼돈의 타이탄',
        hp: 600,
        attack: 45,
        exp: 600,
        weakness: '질서',
        description: '혼돈 그 자체인 최종 보스. 질서와 봉인의 마법으로 대항하세요.',
        specialAttack: '혼돈의 폭풍',
        loot: {
            potions: 3,
            scrolls: 3,
            thunderSpells: 2,
            iceSpells: 2
        }
    }
};

// 층수별 보스 가져오기
function getBossForFloor(floor) {
    return BOSSES[floor] || BOSSES[5]; // 기본값은 첫 보스
}

// 보스 소개
function showBossIntro(boss) {
    const overlay = document.getElementById('bossOverlay');
    const title = document.getElementById('bossTitle');
    const sprite = document.getElementById('bossSprite');
    const description = document.getElementById('bossDescription');
    
    title.textContent = `${boss.name} 등장!`;
    sprite.textContent = boss.icon;
    description.textContent = boss.description;
    
    overlay.classList.add('active');
    
    addMessage(`⚠️ 보스 등장: ${boss.name}!`, 'boss');
}

// 보스전 시작
function startBossFight() {
    const overlay = document.getElementById('bossOverlay');
    overlay.classList.remove('active');
    
    const boss = game.entities.find(e => e.type === 'boss');
    if (boss) {
        game.isBossFight = true;
        game.currentBoss = boss;
        
        // 보스 패널 표시
        const bossPanel = document.getElementById('bossPanel');
        bossPanel.style.display = 'block';
        
        document.getElementById('bossName').textContent = boss.name;
        document.getElementById('bossWeakness').textContent = boss.weakness;
        document.getElementById('bossHint').textContent = 
            `힌트: 프롬프트에 "${boss.weakness}" 관련 키워드를 포함시켜보세요!`;
        
        updateBossHP();
        
        addMessage('보스전 시작! 프롬프트 마법이 필수입니다!', 'boss');
        addMessage(`약점: ${boss.weakness} 속성 공격이 효과적입니다!`, 'info');
    }
}

// 보스전 트리거
function triggerBossFight(boss) {
    if (!game.isBossFight) {
        showBossIntro(boss);
    } else {
        // 이미 보스전 중이면 일반 공격
        bossCombat();
    }
}

// 보스 전투
function bossCombat() {
    if (!game.currentBoss) return;
    
    // 플레이어 공격
    const playerDamage = Math.max(5, game.player.attack - 10); // 보스는 방어력이 높음
    game.currentBoss.hp -= playerDamage;
    
    showDamage(game.currentBoss.x, game.currentBoss.y, playerDamage, false);
    addMessage(`${game.currentBoss.name}에게 ${playerDamage} 데미지! (일반 공격은 효과가 적습니다)`, 'combat');
    
    updateBossHP();
    
    if (game.currentBoss.hp <= 0) {
        defeatBoss();
    } else {
        // 보스 반격
        bossCounterAttack();
    }
}

// 보스 반격
function bossCounterAttack() {
    if (!game.currentBoss) return;
    
    const useSpecial = Math.random() < 0.3; // 30% 확률로 특수 공격
    
    if (useSpecial) {
        // 특수 공격
        const specialDamage = game.currentBoss.attack * 1.5;
        game.player.hp -= specialDamage;
        
        showDamage(game.player.x, game.player.y, specialDamage, true);
        addMessage(`💥 ${game.currentBoss.name}의 ${game.currentBoss.specialAttack}! -${specialDamage} HP`, 'boss');
        
        // 화면 흔들림 효과
        const board = document.getElementById('gameBoard');
        board.style.animation = 'shake 0.5s';
        setTimeout(() => board.style.animation = '', 500);
    } else {
        // 일반 공격
        const damage = game.currentBoss.attack;
        game.player.hp -= damage;
        
        showDamage(game.player.x, game.player.y, damage, true);
        addMessage(`${game.currentBoss.name}의 공격! -${damage} HP`, 'combat');
    }
    
    if (game.player.hp <= 0) {
        gameOver();
    }
    
    updateStats();
}

// 보스 HP 업데이트
function updateBossHP() {
    if (!game.currentBoss) return;
    
    const hpPercent = Math.max(0, (game.currentBoss.hp / game.currentBoss.maxHp) * 100);
    document.getElementById('bossHpBar').style.width = hpPercent + '%';
    
    // HP가 낮아지면 색상 변경
    const hpBar = document.getElementById('bossHpBar');
    if (hpPercent < 30) {
        hpBar.style.background = 'linear-gradient(90deg, #ff0000, #ff6666)';
    } else if (hpPercent < 60) {
        hpBar.style.background = 'linear-gradient(90deg, #ff6600, #ffaa00)';
    }
}

// 보스 처치
function defeatBoss() {
    if (!game.currentBoss) return;
    
    const boss = game.currentBoss;
    const index = game.entities.indexOf(boss);
    
    // 보스 제거
    game.entities.splice(index, 1);
    const el = document.getElementById(`entity-${index}`);
    if (el) el.remove();
    
    // 보상
    game.player.exp += boss.exp;
    game.killCount++;
    
    // 대량 보상
    addMessage(`🎊 ${boss.name} 처치! +${boss.exp} EXP`, 'success');
    addMessage('🎁 보스 보상 획득!', 'loot');
    
    // 보스 드롭
    if (boss.loot) {
        for (const [item, amount] of Object.entries(boss.loot)) {
            const actualAmount = Math.random() < amount ? Math.ceil(amount) : Math.floor(amount);
            if (actualAmount > 0) {
                switch(item) {
                    case 'potions':
                        game.player.inventory.potions += actualAmount;
                        addMessage(`🧪 체력 포션 x${actualAmount}`, 'loot');
                        break;
                    case 'scrolls':
                        game.player.inventory.scrolls += actualAmount;
                        addMessage(`📜 프롬프트 스크롤 x${actualAmount}`, 'loot');
                        break;
                    case 'thunderSpells':
                        game.player.inventory.thunderSpells += actualAmount;
                        addMessage(`⚡ 번개 주문서 x${actualAmount}`, 'loot');
                        break;
                    case 'iceSpells':
                        game.player.inventory.iceSpells += actualAmount;
                        addMessage(`❄️ 얼음 주문서 x${actualAmount}`, 'loot');
                        break;
                }
            }
        }
    }
    
    // 보스전 종료
    game.isBossFight = false;
    game.currentBoss = null;
    document.getElementById('bossPanel').style.display = 'none';
    
    // 계단 생성
    game.map[boss.y][boss.x] = TILES.STAIRS;
    renderMap();
    
    // 레벨업 체크
    if (game.player.exp >= game.player.maxExp) {
        levelUp();
    }
    
    // 특별 보너스
    game.player.maxHp += 50;
    game.player.hp = game.player.maxHp;
    game.player.attack += 10;
    game.player.defense += 5;
    game.player.magic += 20;
    
    addMessage('💪 보스 처치 보너스! 모든 능력치 대폭 상승!', 'success');
    
    updateStats();
    updateInventory();
    
    // 승리 메시지
    if (game.floor === 25) {
        // 최종 보스 처치
        setTimeout(() => {
            victory();
        }, 2000);
    }
}

// 게임 승리
function victory() {
    const overlay = document.createElement('div');
    overlay.className = 'victory-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        animation: fadeIn 1s;
    `;
    
    overlay.innerHTML = `
        <div style="text-align: center; animation: zoomIn 1s;">
            <h1 style="font-size: 48px; color: #FFD700; margin-bottom: 30px; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
                🏆 VICTORY! 🏆
            </h1>
            <div style="font-size: 20px; color: white; margin-bottom: 20px;">
                최종 보스를 물리쳤습니다!
            </div>
            <div style="font-size: 16px; color: #FFD700; margin-bottom: 30px; line-height: 2;">
                <div>최종 레벨: ${game.player.level}</div>
                <div>처치한 몬스터: ${game.killCount}</div>
                <div>최고 프롬프트 점수: ${game.maxPromptScore}%</div>
            </div>
            <div style="font-size: 14px; color: white; margin-bottom: 30px;">
                당신은 진정한 AI 던전 마스터입니다!
            </div>
            <button onclick="location.reload()" style="
                padding: 15px 40px;
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                color: #000;
                border: none;
                font-size: 16px;
                font-family: 'Press Start 2P', monospace;
                cursor: pointer;
                border-radius: 8px;
            ">
                새 게임 시작
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translate(0, 0); }
        10%, 30%, 50%, 70%, 90% { transform: translate(-2px, 0); }
        20%, 40%, 60%, 80% { transform: translate(2px, 0); }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes zoomIn {
        from {
            transform: scale(0);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
