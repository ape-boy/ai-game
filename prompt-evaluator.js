// prompt-evaluator.js - 프롬프트 평가 시스템

// 프롬프트 평가 기준
const PROMPT_CRITERIA = {
    // System Prompt 평가
    systemKeywords: {
        role: ['마법사', '전사', '마도사', '소환사', '엘리멘탈리스트', '대마법사', '아크메이지'],
        ability: ['강력한', '고대의', '전설적인', '신성한', '파괴적인', '절대적인'],
        knowledge: ['마법', '주문', '속성', '원소', '에너지', '마나', '룬']
    },
    
    // User Prompt 평가
    userKeywords: {
        action: ['시전', '공격', '발동', '소환', '해방', '폭발', '파괴'],
        target: ['모든 적', '적들', '몬스터', '대상', '범위', '전체'],
        method: ['단계별로', '순서대로', '체계적으로', '전략적으로', '정확하게'],
        specific: ['화염', '얼음', '번개', '빛', '어둠', '폭풍', '지진']
    },
    
    // 보너스 패턴
    bonusPatterns: {
        chainOfThought: /단계|순서|첫째.*둘째|1\.|2\.|3\./,
        numbers: /\d+/g,
        detailed: /.{50,}/,
        structured: /그리고|또한|다음으로|마지막으로/
    },
    
    // 보스별 특수 키워드
    bossWeakness: {
        '불의 드래곤': ['얼음', '물', '냉기', '프로스트', '블리자드'],
        '얼음 골렘': ['화염', '불', '열', '파이어', '인페르노'],
        '어둠의 마왕': ['빛', '성스러운', '신성한', '정화', '홀리'],
        '고대 리치': ['생명', '치유', '부활', '성스러운', '정화'],
        '혼돈의 타이탄': ['질서', '봉인', '결계', '구속', '통제']
    }
};

// 프롬프트 평가 함수
function evaluatePrompt(systemPrompt, userPrompt) {
    let score = 0;
    const feedback = {
        system: [],
        user: [],
        bonus: [],
        total: 0
    };
    
    // System Prompt 평가 (최대 40점)
    const systemLower = systemPrompt.toLowerCase();
    
    // 역할 키워드 (15점)
    const hasRole = PROMPT_CRITERIA.systemKeywords.role.some(keyword => 
        systemLower.includes(keyword)
    );
    if (hasRole) {
        score += 15;
        feedback.system.push('✅ 명확한 역할 정의 (+15)');
    } else {
        feedback.system.push('❌ 역할을 더 구체적으로 정의하세요');
    }
    
    // 능력 키워드 (15점)
    const hasAbility = PROMPT_CRITERIA.systemKeywords.ability.some(keyword => 
        systemLower.includes(keyword)
    );
    if (hasAbility) {
        score += 15;
        feedback.system.push('✅ 강력한 능력 묘사 (+15)');
    }
    
    // 지식 키워드 (10점)
    const hasKnowledge = PROMPT_CRITERIA.systemKeywords.knowledge.some(keyword => 
        systemLower.includes(keyword)
    );
    if (hasKnowledge) {
        score += 10;
        feedback.system.push('✅ 전문 지식 포함 (+10)');
    }
    
    // User Prompt 평가 (최대 40점)
    const userLower = userPrompt.toLowerCase();
    
    // 행동 키워드 (10점)
    const hasAction = PROMPT_CRITERIA.userKeywords.action.some(keyword => 
        userLower.includes(keyword)
    );
    if (hasAction) {
        score += 10;
        feedback.user.push('✅ 명확한 행동 지시 (+10)');
    } else {
        feedback.user.push('❌ 구체적인 행동을 지시하세요');
    }
    
    // 대상 키워드 (10점)
    const hasTarget = PROMPT_CRITERIA.userKeywords.target.some(keyword => 
        userLower.includes(keyword)
    );
    if (hasTarget) {
        score += 10;
        feedback.user.push('✅ 명확한 대상 지정 (+10)');
    }
    
    // 방법 키워드 (10점)
    const hasMethod = PROMPT_CRITERIA.userKeywords.method.some(keyword => 
        userLower.includes(keyword)
    );
    if (hasMethod) {
        score += 10;
        feedback.user.push('✅ 체계적인 방법 제시 (+10)');
    }
    
    // 구체적 속성 (10점)
    const hasSpecific = PROMPT_CRITERIA.userKeywords.specific.some(keyword => 
        userLower.includes(keyword)
    );
    if (hasSpecific) {
        score += 10;
        feedback.user.push('✅ 구체적인 속성 명시 (+10)');
    }
    
    // 보너스 평가 (최대 20점)
    
    // Chain of Thought 보너스 (10점)
    if (PROMPT_CRITERIA.bonusPatterns.chainOfThought.test(userLower)) {
        score += 10;
        feedback.bonus.push('🌟 Chain-of-Thought 사용! (+10)');
    }
    
    // 숫자 사용 보너스 (5점)
    const numbers = userPrompt.match(PROMPT_CRITERIA.bonusPatterns.numbers);
    if (numbers && numbers.length > 0) {
        score += 5;
        feedback.bonus.push('🌟 구체적인 수치 사용! (+5)');
    }
    
    // 상세한 설명 보너스 (5점)
    if (userPrompt.length > 50) {
        score += 5;
        feedback.bonus.push('🌟 상세한 설명! (+5)');
    }
    
    feedback.total = Math.min(100, score);
    return feedback;
}

// 보스 약점 체크
function checkBossWeakness(bossName, systemPrompt, userPrompt) {
    const weaknesses = PROMPT_CRITERIA.bossWeakness[bossName];
    if (!weaknesses) return 0;
    
    const combinedPrompt = (systemPrompt + ' ' + userPrompt).toLowerCase();
    let weaknessBonus = 0;
    
    weaknesses.forEach(weakness => {
        if (combinedPrompt.includes(weakness)) {
            weaknessBonus = 50; // 약점 공격시 50% 보너스
            addMessage(`💎 보스의 약점을 찾았습니다! (+50% 위력)`, 'boss');
        }
    });
    
    return weaknessBonus;
}

// 프롬프트 마법 시전
async function castPromptSpell() {
    const systemPrompt = document.getElementById('systemPrompt').value;
    const userPrompt = document.getElementById('userPrompt').value;
    
    if (!systemPrompt || !userPrompt) {
        addMessage('프롬프트를 모두 입력하세요!', 'combat');
        return;
    }
    
    // 프롬프트 평가
    const evaluation = evaluatePrompt(systemPrompt, userPrompt);
    
    // 피드백 표시
    evaluation.system.forEach(msg => console.log(msg));
    evaluation.user.forEach(msg => console.log(msg));
    evaluation.bonus.forEach(msg => console.log(msg));
    
    // 위력 표시
    document.getElementById('promptPower').textContent = evaluation.total;
    
    // 점수 저장
    if (evaluation.total > game.maxPromptScore) {
        game.maxPromptScore = evaluation.total;
    }
    
    // 보스전 체크
    if (game.isBossFight && game.currentBoss) {
        const weaknessBonus = checkBossWeakness(game.currentBoss.name, systemPrompt, userPrompt);
        evaluation.total += weaknessBonus;
    }
    
    // API 호출 시뮬레이션 (실제 구현시 여기에 API 호출)
    addMessage(`🔮 프롬프트 마법 시전! (위력: ${evaluation.total}%)`, 'success');
    
    // 실제 효과 적용
    applyPromptEffect(evaluation.total);
    
    // 프롬프트 창 닫기
    closePrompt();
}

// 프롬프트 효과 적용
function applyPromptEffect(power) {
    // 기본 데미지 계산
    const baseDamage = 20 + game.player.magic;
    const actualDamage = Math.floor(baseDamage * (power / 100) * 2);
    
    if (game.isBossFight && game.currentBoss) {
        // 보스전 데미지
        const bossIndex = game.entities.indexOf(game.currentBoss);
        game.currentBoss.hp -= actualDamage;
        
        showDamage(game.currentBoss.x, game.currentBoss.y, actualDamage, false);
        addMessage(`${game.currentBoss.name}에게 ${actualDamage} 마법 데미지!`, 'boss');
        
        updateBossHP();
        
        if (game.currentBoss.hp <= 0) {
            defeatBoss();
        } else {
            // 보스 반격
            bossCounterAttack();
        }
    } else {
        // 일반 전투 - 범위 공격
        let defeatedCount = 0;
        
        game.entities.filter(e => e.type === 'enemy').forEach(enemy => {
            enemy.hp -= actualDamage;
            showDamage(enemy.x, enemy.y, actualDamage, false);
            
            if (enemy.hp <= 0) {
                defeatEnemy(enemy);
                defeatedCount++;
            }
        });
        
        if (defeatedCount > 0) {
            addMessage(`${defeatedCount}마리의 적을 처치했습니다!`, 'success');
        }
        
        // 추가 효과
        if (power >= 80) {
            // 높은 점수시 체력 회복
            const healAmount = 30;
            game.player.hp = Math.min(game.player.maxHp, game.player.hp + healAmount);
            showDamage(game.player.x, game.player.y, `+${healAmount}`, false, true);
            addMessage('완벽한 프롬프트! 체력 회복!', 'success');
        }
        
        if (power >= 60) {
            // 중간 점수시 보호막
            game.player.defense += 5;
            addMessage('프롬프트 보호막 생성! 방어력 +5', 'success');
            setTimeout(() => {
                game.player.defense -= 5;
                updateStats();
            }, 10000); // 10초 지속
        }
    }
    
    updateStats();
}

// 프롬프트 입력 실시간 피드백
document.addEventListener('DOMContentLoaded', () => {
    const systemPrompt = document.getElementById('systemPrompt');
    const userPrompt = document.getElementById('userPrompt');
    const systemHint = document.getElementById('systemHint');
    const userHint = document.getElementById('userHint');
    
    // System Prompt 입력 피드백
    systemPrompt?.addEventListener('input', () => {
        const value = systemPrompt.value.toLowerCase();
        
        if (value.length < 10) {
            systemHint.textContent = '💡 더 자세히 작성해주세요';
            systemHint.className = 'prompt-hint';
        } else if (PROMPT_CRITERIA.systemKeywords.role.some(k => value.includes(k))) {
            systemHint.textContent = '✨ 좋은 역할 정의입니다!';
            systemHint.className = 'prompt-hint good';
        } else {
            systemHint.textContent = '💡 마법사, 전사 등의 역할을 추가해보세요';
            systemHint.className = 'prompt-hint';
        }
    });
    
    // User Prompt 입력 피드백
    userPrompt?.addEventListener('input', () => {
        const value = userPrompt.value.toLowerCase();
        
        if (value.length < 10) {
            userHint.textContent = '💡 더 구체적인 명령을 작성해주세요';
            userHint.className = 'prompt-hint';
        } else if (PROMPT_CRITERIA.bonusPatterns.chainOfThought.test(value)) {
            userHint.textContent = '🌟 Chain-of-Thought 감지! 보너스 점수!';
            userHint.className = 'prompt-hint good';
        } else if (PROMPT_CRITERIA.userKeywords.action.some(k => value.includes(k))) {
            userHint.textContent = '✨ 명확한 행동 지시입니다!';
            userHint.className = 'prompt-hint good';
        } else {
            userHint.textContent = '💡 단계별로, 순서대로 등을 사용해보세요';
            userHint.className = 'prompt-hint';
        }
        
        // 실시간 점수 계산
        if (systemPrompt.value && userPrompt.value) {
            const evaluation = evaluatePrompt(systemPrompt.value, userPrompt.value);
            document.getElementById('promptPower').textContent = evaluation.total;
        }
    });
});
