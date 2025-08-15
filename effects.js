// effects.js - 이펙트 및 게임성 향상 시스템

// ========== 레벨업 보상 시스템 ==========
const LEVEL_REWARDS = {
    2: { skill: 'doubleStrike', name: '더블 스트라이크', desc: '10% 확률로 2회 공격' },
    3: { skill: 'lifeSteal', name: '흡혈', desc: '공격 시 10% 체력 흡수' },
    5: { skill: 'criticalHit', name: '치명타', desc: '20% 확률로 2배 데미지' },
    7: { skill: 'magicShield', name: '마법 방어막', desc: '받는 데미지 20% 감소' },
    10: { skill: 'autoPrompt', name: '자동 프롬프트', desc: '프롬프트 위력 +20% 기본 보너스' },
    15: { skill: 'revival', name: '부활', desc: '죽을 시 1회 부활 (50% HP)' },
    20: { skill: 'masterPrompt', name: '프롬프트 마스터', desc: '프롬프트 쿨다운 없음' }
};

// 플레이어 스킬 체크
let playerSkills = new Set();
let hasRevived = false;

// 레벨업 보상 획득
function checkLevelRewards(level) {
    const reward = LEVEL_REWARDS[level];
    if (reward && !playerSkills.has(reward.skill)) {
        playerSkills.add(reward.skill);
        
        // 특별 이펙트
        showSpecialEffect('levelReward', reward.name);
        addMessage(`🎯 새로운 스킬 획득: ${reward.name}`, 'success');
        addMessage(`효과: ${reward.desc}`, 'info');
        
        // 스킬 UI 업데이트
        updateSkillDisplay();
    }
}

// ========== 콤보 시스템 ==========
let comboCount = 0;
let comboTimer = null;
let maxCombo = 0;

function incrementCombo() {
    comboCount++;
    if (comboCount > maxCombo) maxCombo = comboCount;
    
    // 콤보 타이머 리셋
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
        if (comboCount > 3) {
            addMessage(`${comboCount} 콤보 종료! 보너스 경험치 +${comboCount * 5}`, 'success');
            game.player.exp += comboCount * 5;
        }
        comboCount = 0;
        updateComboDisplay();
    }, 3000);
    
    updateComboDisplay();
    
    // 콤보 이펙트
    if (comboCount > 3) {
        showComboEffect(comboCount);
    }
}

function updateComboDisplay() {
    const comboDiv = document.getElementById('comboDisplay');
    if (!comboDiv) {
        const header = document.querySelector('.game-header');
        const combo = document.createElement('div');
        combo.id = 'comboDisplay';
        combo.style.cssText = `
            position: absolute;
            top: -30px;
            right: 10px;
            font-size: 20px;
            color: #FFD700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            display: none;
        `;
        header.appendChild(combo);
    }
    
    const display = document.getElementById('comboDisplay');
    if (comboCount > 0) {
        display.style.display = 'block';
        display.textContent = `${comboCount} COMBO!`;
        display.style.animation = 'comboPulse 0.3s';
    } else {
        display.style.display = 'none';
    }
}

// ========== 파티클 이펙트 시스템 ==========
function createParticles(x, y, type = 'damage') {
    const board = document.getElementById('gameBoard');
    const particleCount = type === 'levelup' ? 20 : 10;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const angle = (Math.PI * 2 / particleCount) * i;
        const velocity = 50 + Math.random() * 50;
        const offsetX = Math.cos(angle) * velocity;
        const offsetY = Math.sin(angle) * velocity;
        
        particle.style.cssText = `
            position: absolute;
            left: ${x * 40 + 20}px;
            top: ${y * 40 + 20}px;
            width: 4px;
            height: 4px;
            background: ${getParticleColor(type)};
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            animation: particleFly 1s ease-out forwards;
        `;
        
        particle.style.setProperty('--endX', offsetX + 'px');
        particle.style.setProperty('--endY', offsetY + 'px');
        
        board.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }
}

function getParticleColor(type) {
    const colors = {
        damage: '#ff6b6b',
        heal: '#6ab04c',
        levelup: '#FFD700',
        magic: '#9b59b6',
        boss: '#ff00ff',
        combo: '#00ffff'
    };
    return colors[type] || '#ffffff';
}

// ========== 화면 효과 ==========
function screenShake(intensity = 'medium') {
    const board = document.getElementById('gameBoard');
    const shakeClass = `shake-${intensity}`;
    board.classList.add(shakeClass);
    setTimeout(() => board.classList.remove(shakeClass), 500);
}

function screenFlash(color = '#ffffff') {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: ${color};
        opacity: 0;
        pointer-events: none;
        z-index: 9999;
        animation: flashEffect 0.3s ease-out;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
}

// ========== 특별 이펙트 ==========
function showSpecialEffect(type, text = '') {
    const effect = document.createElement('div');
    effect.className = 'special-effect';
    
    switch(type) {
        case 'critical':
            effect.innerHTML = `<div style="color: #ff00ff; font-size: 32px;">CRITICAL!</div>`;
            screenShake('strong');
            break;
            
        case 'perfect':
            effect.innerHTML = `<div style="color: #FFD700; font-size: 36px;">PERFECT!</div>`;
            screenFlash('#FFD700');
            break;
            
        case 'levelReward':
            effect.innerHTML = `
                <div style="color: #00ffff; font-size: 24px;">새로운 스킬!</div>
                <div style="color: #ffffff; font-size: 16px; margin-top: 10px;">${text}</div>
            `;
            break;
            
        case 'bossDefeat':
            effect.innerHTML = `<div style="color: #ff00ff; font-size: 40px;">BOSS DEFEATED!</div>`;
            screenFlash('#ff00ff');
            createFireworks();
            break;
    }
    
    effect.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        z-index: 1000;
        animation: specialEffectAnim 2s ease-out forwards;
    `;
    
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 2000);
}

// ========== 콤보 이펙트 ==========
function showComboEffect(count) {
    const colors = ['#FFD700', '#ff00ff', '#00ffff', '#ff6b6b', '#6ab04c'];
    const color = colors[Math.min(count - 1, colors.length - 1)];
    
    const combo = document.createElement('div');
    combo.style.cssText = `
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: ${20 + count * 4}px;
        color: ${color};
        text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
        z-index: 1000;
        animation: comboAnim 1s ease-out forwards;
    `;
    combo.textContent = `${count} COMBO!`;
    
    document.body.appendChild(combo);
    setTimeout(() => combo.remove(), 1000);
}

// ========== 폭죽 효과 ==========
function createFireworks() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight / 2;
            createFirework(x, y);
        }, i * 200);
    }
}

function createFirework(x, y) {
    const colors = ['#FFD700', '#ff00ff', '#00ffff', '#ff6b6b', '#6ab04c'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        const angle = (Math.PI * 2 / 30) * i;
        const velocity = 100 + Math.random() * 100;
        
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 6px;
            height: 6px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            animation: fireworkParticle 1.5s ease-out forwards;
        `;
        
        particle.style.setProperty('--endX', Math.cos(angle) * velocity + 'px');
        particle.style.setProperty('--endY', Math.sin(angle) * velocity + 'px');
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1500);
    }
}

// ========== 스킬 효과 적용 ==========
function applySkillEffects(damage, isPlayerAttack = true) {
    let finalDamage = damage;
    
    if (isPlayerAttack) {
        // 치명타
        if (playerSkills.has('criticalHit') && Math.random() < 0.2) {
            finalDamage *= 2;
            showSpecialEffect('critical');
            incrementCombo();
        }
        
        // 더블 스트라이크
        if (playerSkills.has('doubleStrike') && Math.random() < 0.1) {
            addMessage('더블 스트라이크 발동!', 'success');
            return { damage: finalDamage, doubleStrike: true };
        }
        
        // 흡혈
        if (playerSkills.has('lifeSteal')) {
            const heal = Math.floor(finalDamage * 0.1);
            game.player.hp = Math.min(game.player.maxHp, game.player.hp + heal);
            showDamage(game.player.x, game.player.y, `+${heal}`, false, true);
        }
    } else {
        // 마법 방어막
        if (playerSkills.has('magicShield')) {
            finalDamage = Math.floor(finalDamage * 0.8);
        }
    }
    
    return { damage: finalDamage, doubleStrike: false };
}

// ========== 부활 시스템 ==========
function checkRevival() {
    if (playerSkills.has('revival') && !hasRevived && game.player.hp <= 0) {
        hasRevived = true;
        game.player.hp = Math.floor(game.player.maxHp * 0.5);
        
        screenFlash('#FFD700');
        showSpecialEffect('perfect', '부활!');
        addMessage('🔥 부활 스킬 발동! 한 번 더 기회가 주어집니다!', 'success');
        
        updateStats();
        return true;
    }
    return false;
}

// ========== 스킬 UI 표시 ==========
function updateSkillDisplay() {
    let skillPanel = document.getElementById('skillPanel');
    if (!skillPanel) {
        const sidePanel = document.querySelector('.side-panel');
        skillPanel = document.createElement('div');
        skillPanel.id = 'skillPanel';
        skillPanel.className = 'skill-panel';
        skillPanel.style.cssText = `
            background: #0a0a0a;
            border: 3px solid #FFD700;
            border-radius: 10px;
            padding: 15px;
            margin-top: 15px;
        `;
        sidePanel.appendChild(skillPanel);
    }
    
    let html = '<div style="color: #FFD700; font-size: 12px; margin-bottom: 10px;">🎯 획득한 스킬</div>';
    html += '<div style="font-size: 10px; line-height: 1.8;">';
    
    for (let skill of playerSkills) {
        const skillData = Object.values(LEVEL_REWARDS).find(r => r.skill === skill);
        if (skillData) {
            html += `<div style="color: #4ecdc4; margin-bottom: 5px;">• ${skillData.name}</div>`;
        }
    }
    
    html += '</div>';
    skillPanel.innerHTML = html;
}

// ========== 프롬프트 이펙트 향상 ==========
function enhancedPromptEffect(power) {
    // 기본 효과
    const baseDamage = 20 + game.player.magic;
    let actualDamage = Math.floor(baseDamage * (power / 100) * 2);
    
    // 자동 프롬프트 보너스
    if (playerSkills.has('autoPrompt')) {
        actualDamage = Math.floor(actualDamage * 1.2);
        power += 20;
    }
    
    // 퍼펙트 프롬프트
    if (power >= 100) {
        showSpecialEffect('perfect');
        actualDamage *= 2;
        addMessage('💯 완벽한 프롬프트! 데미지 2배!', 'success');
    }
    
    // 화면 효과
    if (power >= 80) {
        screenFlash('#9b59b6');
        createMagicCircle();
    } else if (power >= 60) {
        screenShake('medium');
    }
    
    return actualDamage;
}

// ========== 마법진 효과 ==========
function createMagicCircle() {
    const circle = document.createElement('div');
    circle.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 300px;
        height: 300px;
        border: 3px solid #9b59b6;
        border-radius: 50%;
        box-shadow: 0 0 50px #9b59b6;
        pointer-events: none;
        z-index: 999;
        animation: magicCircleAnim 2s ease-out forwards;
    `;
    
    document.body.appendChild(circle);
    setTimeout(() => circle.remove(), 2000);
}

// ========== CSS 애니메이션 추가 ==========
const effectStyles = document.createElement('style');
effectStyles.textContent = `
    @keyframes particleFly {
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(var(--endX), var(--endY)) scale(0);
            opacity: 0;
        }
    }
    
    @keyframes fireworkParticle {
        0% {
            transform: translate(0, 0);
            opacity: 1;
        }
        100% {
            transform: translate(var(--endX), var(--endY));
            opacity: 0;
        }
    }
    
    @keyframes flashEffect {
        0% { opacity: 0; }
        50% { opacity: 0.8; }
        100% { opacity: 0; }
    }
    
    @keyframes specialEffectAnim {
        0% {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.5) rotate(180deg);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes comboAnim {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -100%) scale(1);
            opacity: 0;
        }
    }
    
    @keyframes comboPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }
    
    @keyframes magicCircleAnim {
        0% {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1) rotate(180deg);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1.5) rotate(360deg);
            opacity: 0;
        }
    }
    
    .shake-light {
        animation: shakeLight 0.5s;
    }
    
    .shake-medium {
        animation: shakeMedium 0.5s;
    }
    
    .shake-strong {
        animation: shakeStrong 0.5s;
    }
    
    @keyframes shakeLight {
        0%, 100% { transform: translate(0, 0); }
        25% { transform: translate(-2px, 0); }
        75% { transform: translate(2px, 0); }
    }
    
    @keyframes shakeMedium {
        0%, 100% { transform: translate(0, 0); }
        10%, 30%, 50%, 70%, 90% { transform: translate(-4px, 0); }
        20%, 40%, 60%, 80% { transform: translate(4px, 0); }
    }
    
    @keyframes shakeStrong {
        0%, 100% { transform: translate(0, 0); }
        10%, 30%, 50%, 70%, 90% { transform: translate(-8px, -2px); }
        20%, 40%, 60%, 80% { transform: translate(8px, 2px); }
    }
`;
document.head.appendChild(effectStyles);

// 게임 초기화시 호출
window.addEventListener('DOMContentLoaded', () => {
    updateSkillDisplay();
});
