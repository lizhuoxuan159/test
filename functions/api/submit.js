// GET：随机获取50题，只返回题干选项，不返回答案
export async function onRequestGet({ env }) {
  const db = env.DB;
  // 随机抽取50道题目
  const { results } = await db.prepare(`
      SELECT id, content, opt_a, opt_b, opt_c, opt_d FROM question ORDER BY RANDOM() LIMIT 50
  `).all();
  // 获取全局统计信息
  const stat = await db.prepare(`SELECT total_users, total_score FROM stat WHERE id = 1`).first();
  return Response.json({
    questions: results,
    total_users: stat.total_users,
    avg_score: stat.total_score === 0 ? "0.00" : (stat.total_score / stat.total_users).toFixed(2)
  });
}

// POST：提交答案，后端批改，更新D1统计
export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const { answers } = body;
  if (!Array.isArray(answers) || answers.length !== 50) {
    return Response.json({ success: false, msg: "作答数据异常" }, { status: 400 });
  }
  const db = env.DB;
  const qIds = answers.map(item => item.qid);
  const placeholders = qIds.map(() => "?").join(",");
  // 查询标准答案
  const { results } = await db.prepare(`
    SELECT id, answer FROM question WHERE id IN (${placeholders})
  `).bind(...qIds).all();

  let score = 0;
  results.forEach(q => {
    const userAnswer = answers.find(item => item.qid === q.id).sel;
    if (Number(userAnswer) === q.answer) {
      score += 2;
    }
  });
  //原子更新总人数和总分，并发安全
  await db.prepare(`
    UPDATE stat SET total_users = total_users + 1, total_score = total_score + ? WHERE id = 1
  `).bind(score).run();

  const statData = await db.prepare(`SELECT total_users, total_score FROM stat WHERE id =1`).first();
  const avg_score = (statData.total_score / statData.total_users).toFixed(2);
  return Response.json({
    success: true,
    myScore: score,
    total_users: statData.total_users,
    avg_score: avg_score
  });
}
