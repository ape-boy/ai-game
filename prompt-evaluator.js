// prompt-evaluator.js - 간소화된 프롬프트 평가 시스템 (보스전 전용)

// 프롬프트 평가 기준
const PROMPT_CRITERIA = {
    // 전략적 키워드
    strategic: {
        keywords: ['분석', '약점', '패턴', '전략', '예측', '관찰', '연구', '계획'],
        score: 25
    },
    
    // 창의적 접근
    creative: {
        keywords: ['독창적', '혁신적', '창의적', '새로운', '특별한', '독특한', '참신한'],
        score: 20
    },
    
    // 구체적 행동
    specific: {
        keywords: ['정확히', '구체적으로', '단계별로', '체계적으로', '상세히', '명확히'],
        score: 15
    },
    
    // 속성 활용
    elements: {
        keywords: ['화염', '얼음', '번개', '빛', '어둠', '바람', '물', '땅', '가열', '냉각', '건조', '습기'],
        score: 10
    },
    
    // 보너스 패턴
    bonusPatterns: {
        chainOfThought: /단계|순서|첫째.*둘째|1\.|2\.|3\./,
        numbers: /\d+/g,
        detailed: /.{50,}/,
        structured: /그리고|또한|다음으로|마지막으로|이후|동시에/
    }
};

// 보스 약점 시스템 (보스전용)
const BOSS_WEAKNESSES = {
    '슬라임 킹': {
        weaknesses: ['화염', '뜨거운', '증발', '건조', '가열', '고온', '열'],
        hint: '거대한 물덩어리를 말리는 방법은?'
    },
    '던전 드래곤': {
        weaknesses: ['얼음', '신성', '빛', '냉각', '성스러운', '차가운'],
        hint: '고대 용을 얼려버리거나 성스러운 힘으로...'
    }
};

// 기본 점수 계산
function calculateBaseScore(prompt) {
    let score = 10; // 기본점수
    const lowerPrompt = prompt.toLowerCase();
    
    // 각 카테고리별 점수 계산
    for (const [category, data] of Object.entries(PROMPT_CRITERIA)) {
        if (category === 'bonusPatterns') continue;
        
        const hasKeyword = data.keywords.some(keyword => 
            lowerPrompt.includes(keyword.toLowerCase())
        );
        if (hasKeyword) score += data.score;
    }
    
    // 길이 보너스 (너무 짧거나 길면 패널티)
    if (prompt.length > 20 && prompt.length < 200) score += 10;
    if (prompt.length > 50) score += 5;
    
    // 보너스 패턴 체크
    if (PROMPT_CRITERIA.bonusPatterns.chainOfThought.test(lowerPrompt)) {
        score += 15;
    }
    
    const numbers = prompt.match(PROMPT_CRITERIA.bonusPatterns.numbers);
    if (numbers && numbers.length > 0) {
        score += 5;
    }
    
    if (PROMPT_CRITERIA.bonusPatterns.structured.test(lowerPrompt)) {
        score += 10;
    }
    
    return Math.min(85, score); // 최대 85점 (AI 평가를 위한 여유)
}

// 약점 보너스 계산 (보스전용)
function calculateWeaknessBonus(prompt, bossName) {
    const bossData = BOSS_WEAKNESSES[bossName];
    if (!bossData) return 0;
    
    const lowerPrompt = prompt.toLowerCase();
    let bonus = 0;
    
    // 약점 키워드 확인
    bossData.weaknesses.forEach(weakness => {
        if (lowerPrompt.includes(weakness.toLowerCase())) {
            bonus += 15;
        }
    });
    
    return Math.min(30, bonus);
}

// 효과성 레벨 결정
function getEffectivenessLevel(score) {
    if (score >= 80) return 'legendary';
    if (score >= 65) return 'epic';  
    if (score >= 50) return 'rare';
    if (score >= 35) return 'uncommon';
    return 'common';
}

// 피드백 생성
function generateFeedback(score, weaknessBonus, prompt) {
    let feedback = [];
    
    if (score >= 80) feedback.push("🏆 전설적인 마법! 완벽한 주문입니다!");
    else if (score >= 65) feedback.push("⚡ 탁월한 마법! 보스가 당황하고 있습니다!");
    else if (score >= 50) feedback.push("✨ 좋은 마법! 효과적인 주문이네요.");
    else if (score >= 35) feedback.push("🔥 괜찮은 시도! 조금 더 구체적으로!");
    else feedback.push("💪 더 전략적으로 접근해보세요!");
    
    if (weaknessBonus > 0) feedback.push(`🎯 약점 공략 성공! (+${weaknessBonus}점)`);
    
    // 구체적인 개선 제안
    const lowerPrompt = prompt.toLowerCase();
    if (!PROMPT_CRITERIA.bonusPatterns.chainOfThought.test(lowerPrompt)) {
        feedback.push("💡 단계별 접근을 시도해보세요!");
    }
    
    if (prompt.length < 30) {
        feedback.push("📝 더 상세한 설명이 필요합니다!");
    }
    
    return feedback;
}

// 로컬 프롬프트 평가 (보스전 전용)
function evaluatePromptLocally(prompt, bossName) {
    const baseScore = calculateBaseScore(prompt);
    const weaknessBonus = calculateWeaknessBonus(prompt, bossName);
    const finalScore = Math.min(100, baseScore + weaknessBonus);
    
    return {
        score: finalScore,
        baseScore,
        weaknessBonus,
        effectiveness: getEffectivenessLevel(finalScore),
        feedback: generateFeedback(finalScore, weaknessBonus, prompt)
    };
}

// 전역 함수로 등록 (game.js에서 사용)
window.evaluatePromptLocally = evaluatePromptLocally;