const fallbackAnswer = (moduleTitle, question) =>
  `当前部署环境还没有配置 OPENAI_API_KEY，所以先返回本地教学解释。关于「${moduleTitle}」：先观察动画中什么量保持不变，再把这个不变量写成公式。你的问题是「${question}」。可以继续从“几何现象、公式含义、例题”三个角度追问。`;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Only POST requests are supported." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1";
  const { question = "", module = {} } = request.body || {};
  const safeQuestion = String(question).slice(0, 1200).trim();

  if (!safeQuestion) {
    return response.status(400).json({ error: "请输入一个数学问题。" });
  }

  if (!apiKey) {
    return response.status(200).json({
      answer: fallbackAnswer(module.title || "当前模块", safeQuestion),
      offline: true
    });
  }

  const tutorPrompt = [
    "你是一位大学高等代数老师，风格像优秀课堂讲解，而不是公式堆砌。",
    "回答必须使用中文，结构遵循：观察现象 -> 提出问题 -> 直觉解释 -> 公式 -> 小例题。",
    "优先解释当前动画和公式，不要泛泛而谈。语言要适合大一学生，但不能牺牲数学准确性。",
    "如果学生有误区，先指出误区，再给反例或几何解释。"
  ].join("\n");

  const input = [
    {
      role: "developer",
      content: [{ type: "input_text", text: tutorPrompt }]
    },
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: JSON.stringify(
            {
              currentModule: module,
              studentQuestion: safeQuestion
            },
            null,
            2
          )
        }
      ]
    }
  ];

  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input,
      max_output_tokens: 900
    })
  });

  const payload = await openaiResponse.json();

  if (!openaiResponse.ok) {
    return response.status(openaiResponse.status).json({
      error: payload.error?.message || "AI 导师请求失败。"
    });
  }

  const answer =
    payload.output_text ||
    payload.output?.flatMap((item) => item.content || []).find((content) => content.type === "output_text")?.text ||
    "AI 导师没有返回可读文本，请稍后重试。";

  return response.status(200).json({ answer });
}
