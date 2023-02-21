export const getMathOcrResults = async (image: string) => {
    // TODO replace with the an actual API call
    const result = MATH_OCR_RESULTS[image];
    if (!result) {
        throw new Error(`Error getting OCR result for ${image}`);
    }
    return result;
}

const TEXT_WITH_MATH = {
    "confidence": 0.9942260226265052,
    "confidence_rate": 0.9942999454546179,
    "data": [
        {
            "type": "asciimath",
            "value": "(2p-2)/(p)-:(4p-4)/(9p^(2))"
        },
        {
            "type": "latex",
            "value": "\\frac{2 p-2}{p} \\div \\frac{4 p-4}{9 p^{2}}"
        }
    ],
    "html": "<div>Perform the indicated operation and simplify.<br>\n3) <span  class=\"math-inline \" >\n<asciimath style=\"display: none;\">(2p-2)/(p)-:(4p-4)/(9p^(2))</asciimath><latex style=\"display: none\">\\frac{2 p-2}{p} \\div \\frac{4 p-4}{9 p^{2}}</latex></span></div>\n",
    "text": "Perform the indicated operation and simplify.\n3) \\( \\frac{2 p-2}{p} \\div \\frac{4 p-4}{9 p^{2}} \\)"
}

const MULTIPLE_CHOICE = {
    "confidence": 0.9110662494831634,
    "confidence_rate": 0.9488863482674147,
    "data": [
        {
            "type": "asciimath",
            "value": "z_(1)"
        },
        {
            "type": "asciimath",
            "value": "z_(2)"
        },
        {
            "type": "asciimath",
            "value": "z_(1)^(2)+z_(2)^(2)=4"
        },
        {
            "type": "asciimath",
            "value": "((z_(1)+ bar(z)_(1))^(2)+(z_(2)+ bar(z)_(2))^(2))/(2)"
        }
    ],
    "html": "<ol start=\"11\">\n<li><span  class=\"math-inline \" >\n<asciimath style=\"display: none;\">z_(1)</asciimath></span> and <span  class=\"math-inline \" >\n<asciimath style=\"display: none;\">z_(2)</asciimath></span> are unimodular complex numbers that satisfy <span  class=\"math-inline \" >\n<asciimath style=\"display: none;\">z_(1)^(2)+z_(2)^(2)=4</asciimath></span> then the value of <span  class=\"math-inline \" >\n<asciimath style=\"display: none;\">((z_(1)+ bar(z)_(1))^(2)+(z_(2)+ bar(z)_(2))^(2))/(2)</asciimath></span> is<br>\n(a) 10<br>\n(b) 11<br>\n\u00a9 12<br>\n(d) 13</li>\n</ol>\n",
    "text": "11. \\( z_{1} \\) and \\( z_{2} \\) are unimodular complex numbers that satisfy \\( z_{1}^{2}+z_{2}^{2}=4 \\) then the value of \\( \\frac{\\left(z_{1}+\\bar{z}_{1}\\right)^{2}+\\left(z_{2}+\\bar{z}_{2}\\right)^{2}}{2} \\) is\n(a) 10\n(b) 11\n(c) 12\n(d) 13"
}

const HANDWRITTEN_EQUATION = {
    "confidence": 0.9982182085336344,
    "confidence_rate": 0.9982182085336344,
    "data": [
        {
            "type": "asciimath",
            "value": "lim_(x rarr3)((x^(2)+9)/(x-3))"
        },
        {
            "type": "latex",
            "value": "\\lim _{x \\rightarrow 3}\\left(\\frac{x^{2}+9}{x-3}\\right)"
        }
    ],
    "html": "<div><span  class=\"math-inline \" >\n<asciimath style=\"display: none;\">lim_(x rarr3)((x^(2)+9)/(x-3))</asciimath><latex style=\"display: none\">\\lim _{x \\rightarrow 3}\\left(\\frac{x^{2}+9}{x-3}\\right)</latex></span></div>\n",
    "text": "\\( \\lim _{x \\rightarrow 3}\\left(\\frac{x^{2}+9}{x-3}\\right) \\)"
}

const SYSTEM_OF_EQUATIONS = {
    "confidence": 0.9960272582188906,
    "confidence_rate": 0.9960272582188906,
    "data": [
        {
            "type": "asciimath",
            "value": "{[2x+8y=21],[6x-4y=14]:}"
        },
        {
            "type": "latex",
            "value": "\\left\\{\\begin{array}{l}2 x+8 y=21 \\\\ 6 x-4 y=14\\end{array}\\right."
        }
    ],
    "html": "<div><span  class=\"math-inline \" >\n<asciimath style=\"display: none;\">{[2x+8y=21],[6x-4y=14]:}</asciimath><latex style=\"display: none\">\\left\\{\\begin{array}{l}2 x+8 y=21 \\\\ 6 x-4 y=14\\end{array}\\right.</latex></span></div>\n",
    "text": "\\( \\left\\{\\begin{array}{l}2 x+8 y=21 \\\\ 6 x-4 y=14\\end{array}\\right. \\)"
}

const MATH_OCR_RESULTS = {
    'handwritten_equation.jpeg': HANDWRITTEN_EQUATION,
    'system_of_equations.jpeg': SYSTEM_OF_EQUATIONS,
    'multiple_choice.png': MULTIPLE_CHOICE,
    'text_with_math.jpeg': TEXT_WITH_MATH,
}
