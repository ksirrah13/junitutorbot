import take from 'lodash/take';
import shuffle from 'lodash/shuffle';
import { EmbedBuilder } from '@discordjs/builders';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

interface Question {
    question: string, 
    answer: string, 
    other_choices: string[],
    id: string,
}

const SAT_QUESTIONS: Omit<Question, 'id'>[] = [
    {question: "The intricacies of the legal case were navigated with consummate _______.", other_choices: ["lethargy", "frivolity","verbosity"], answer: "dexterity"},
    
    {question: "The professor’s _______ knowledge of the subject enabled a deep, multifaceted exploration of the topic.", other_choices: ["perfunctory","embryonic","regressive"], answer: "erudite"},
    
    {question: "The research scientists were assiduous in their work, tirelessly dedicating every waking hour to the project with great diligence and unwavering focus. Which of the following words best replaces assiduous in the above sentence?", other_choices: ["Intermittent", "Lackadaisical", "Frenetic"], answer: "Rigorous"},
    
    {question: "The product of two consecutive integers is 132. What is the greater integer?", other_choices: ["10", "11", "13"], answer: "12"},
    
    
    {question: "If 3x + 7 = 19, what is the value of x?", other_choices: ["3", "5", "6"], answer: "4"},
    ]


const SAT_QUESTIONS_OLD: Omit<Question, 'id'>[] = [
    {
        "question": "Which of the following is a trigonometric function?",
        "answer": "sine",
        "other_choices": ["cosine", "tangent", "secant"]
        },
        
        {
        "question": "Which of the following statements is true about triangles?",
        "answer": "The sum of the interior angles of a triangle equals 180 degrees.",
        "other_choices": ["The hypotenuse is always the longest side.", "Isosceles triangles have 2 equal sides and 2 equal angles.", "Similar triangles have the same angles."]
        },
        
        {
        "question": "Which of the following is the definition of a function?",
        "answer": "A relation in which each input has exactly one output.",
        "other_choices": ["A relation between variables that can be expressed as an equation.", "A relation that cannot be expressed as an equation.", "A relation where the output depends on the input."]
    
        },
        
        {
        "question": "Which of the following pairs of angles are supplementary?",
        "answer": "130 degrees and 50 degrees",
        "other_choices": ["45 degrees and 90 degrees", "60 degrees and 120 degrees", "75 degrees and 105 degrees"]
        },

        {"question": "Which of the following best describes the composition of the early Earth's atmosphere?", "answer": "Reducing", "other_choices": ["Oxidizing", "Neutral"]},

        {"question": "Which of the following developments had the largest impact on the agricultural revolution?", "answer": "The domestication of animals", "other_choices": ["The invention of the plow", "Irrigation techniques", "Crop rotation"]},
        
        // {"question": "Which of the following statements about the American and French Revolutions is most accurate?", "answer": "The American Revolution resulted in the creation of a new nation, while the French Revolution reshaped an existing nation's government.", "other_choices": ["The American Revolution involved the masses, while the French Revolution was led by the aristocracy.", "The American Revolution maintained the power of the nobility, while the French Revolution overthrew the aristocracy."]},
        
        {"question": "If an object has a mass of 5 kilograms on Earth, what would its mass be on the Moon, where gravity is about one-sixth as strong?", "answer": "5 kilograms", "other_choices": ["Less than 1 kilogram", "30 kilograms"]}    
]

const getRandomId = () => (Math.random() + 1).toString(36).substring(7);

const getRandomQuestions = (count = 5): Question[] => {
    if (count > SAT_QUESTIONS.length) {
        return getRandomQuestions(SAT_QUESTIONS.length);
    }
    return take(shuffle(SAT_QUESTIONS), count).map(question => ({id: getRandomId(), ...question}));
}

const createQuestionEmbed = (question: Question) => {
    const questionEmbed = new EmbedBuilder()
        .setDescription(question.question);
    const correctButton = new ButtonBuilder()
        .setLabel(question.answer)
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`sat-correct:${question.id}`);
    const otherChoices = question.other_choices.map((choice, ix) => 
        new ButtonBuilder()
            .setLabel(choice)
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`sat-incorrect:${question.id}/${ix}`)
    )
    const shuffledButtons = shuffle([correctButton, ...otherChoices]);
    const choicesRow = new ActionRowBuilder<ButtonBuilder>().addComponents(shuffledButtons);
    return {embeds: [questionEmbed], components: [choicesRow], ephemeral: true};
}

export const createQuestions = (count = 5) => {
    const questions = getRandomQuestions(count);
    const allQuestions = questions.map(createQuestionEmbed);
    return allQuestions;
}
