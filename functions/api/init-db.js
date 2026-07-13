export async function onRequestGet({ request, env }) {
  try {
    const db = env.DB;
    const { searchParams } = new URL(request.url);
    const start = parseInt(searchParams.get("start") || "1");
    const batchSize = 50;
    const end = start + batchSize - 1;

    //仅第一次调用初始化数据表
    if (start === 1) {
      await db.prepare(`
      CREATE TABLE IF NOT EXISTS question(
          id INTEGER PRIMARY KEY,
          type TEXT NOT NULL,
          content TEXT NOT NULL,
          opt_a TEXT NOT NULL,
          opt_b TEXT NOT NULL,
          opt_c TEXT NOT NULL,
          opt_d TEXT NOT NULL,
          answer INTEGER NOT NULL CHECK(answer BETWEEN 0 AND 3)
      )
      `).run();

      await db.prepare(`
      CREATE TABLE IF NOT EXISTS stat (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          total_users INTEGER DEFAULT 0,
          total_score INTEGER DEFAULT 0
      )`).run();
      await db.prepare(`INSERT OR IGNORE INTO stat(id,total_users,total_score) VALUES (1,0,0)`).run();
      await db.prepare(`DELETE FROM question`).run();
      await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'question'`).run();
    }

    const typeConfig = [
      {
        typeName: "逻辑思考",
        descriptions: [
          "遇到难题时，你习惯逐层拆解问题",
          "做选择前会把利弊逐条分析清楚",
          "别人讲复杂事情，你能快速理清条理",
          "发现一件事有矛盾之处会认真思考根源",
          "面对多个任务时，会判断事情优先级"
        ],
        options: ["经常如此", "偶尔这样", "很少做到", "几乎不会"]
      },
      {
        typeName: "阅读理解",
        descriptions: [
          "长篇文字看完，可以准确抓住核心意思",
          "别人随口说的话，你能读懂隐藏含义",
          "看书或者短文之后可以记住关键细节",
          "听别人长篇讲述不会轻易走神",
          "复杂的规则你可以快速理解记住"
        ],
        options: ["完全没问题", "勉强看懂", "容易遗漏重点", "理解十分吃力"]
      },
      {
        typeName: "耐心排错",
        descriptions: [
          "事情出错之后，你会冷静查找问题原因",
          "反复做错一件事，依然愿意耐心复盘",
          "发现计划漏洞，主动调整方案补救",
          "遇到意外状况不会慌乱烦躁",
          "一件事多次失败仍然愿意坚持尝试"
        ],
        options: ["心态稳定从容", "容易烦躁放弃", "摆烂敷衍了事", "直接推卸责任"]
      },
      {
        typeName: "自学能力",
        descriptions: [
          "接触全新领域可以靠自己慢慢摸索学会",
          "看到别人优秀，愿意主动学习对方长处",
          "做完一件事情之后会总结经验教训",
          "旧的经验可以灵活用在全新场景",
          "空闲时间愿意主动提升自己"
        ],
        options: ["主动学习型", "被逼才会学", "学一会儿就疲惫", "完全不想学习"]
      },
      {
        typeName: "规划意识",
        descriptions: [
          "做长期事情，会提前做好分步计划",
          "日常任务懂得拆分变小任务逐个完成",
          "懂得取舍，优先做重要的事情",
          "做事懂得考虑长远后果，不只看眼前",
          "日常会安排自己的空闲时间"
        ],
        options: ["做事很有规划", "想到什么做什么", "拖延严重", "完全随心所欲"]
      }
    ];

    //只生成当前批次题目
    for (let i = start; i <= end && i <= 500; i++) {
      const idx = i % 5;
      const config = typeConfig[idx];
      const desc = config.descriptions[i % 5];
      const content = `${i}.【${config.typeName}】${desc}`;
      let ans;
      if (i % 5 === 0) ans = 0;
      else if (i % 5 === 1) ans = 0;
      else if (i % 5 === 2) ans = 1;
      else if (i % 5 === 3) ans = 0;
      else ans = 1;
      await db.prepare(`INSERT INTO question(id, type, content, opt_a, opt_b, opt_c, opt_d, answer) VALUES (?,?,?,?,?,?,?,?)`)
        .bind(i, config.typeName, content, config.options[0], config.options[1], config.options[2], config.options[3], ans).run();
    }
    return Response.json({ success: true, range: `${start}-${end}` });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
