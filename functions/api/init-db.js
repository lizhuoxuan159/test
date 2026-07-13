export async function onRequestGet({ env }) {
  try {
    const db = env.DB;
    // 1. 创建数据表
    await db.prepare(`
    CREATE TABLE IF NOT EXISTS question(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    //清空旧题目，防止重复插入
    await db.prepare(`DELETE FROM question`).run();

    //生成500道题目
    const typeConfig = [
      {
        typeName: "逻辑思维",
        descriptions: [
          "判断循环终止条件是否合理",
          "分析if‑else分支覆盖完整性",
          "推导代码执行输出结果",
          "识别隐藏逻辑漏洞",
          "化简复杂条件表达式"
        ],
        options: ["逻辑严谨", "存在漏洞", "条件不足", "逻辑冗余"]
      },
      {
        typeName: "代码阅读",
        descriptions: [
          "判断代码语法是否会编译报错",
          "判断变量命名是否符合规范",
          "分析运算符优先级执行结果",
          "理解JS隐式类型转换",
          "判断缩进和代码块范围"
        ],
        options: ["语法正确", "编译报错", "运行时异常", "兼容性问题"]
      },
      {
        typeName: "Bug排查",
        descriptions: [
          "定位空指针异常产生原因",
          "分析程序运行超时的根源",
          "识别冗余无用代码片段",
          "判断内存占用过高诱因",
          "选择合适异常捕获时机"
        ],
        options: ["代码Bug", "环境配置问题", "参数传递错误", "操作系统问题"]
      },
      {
        typeName: "自学能力",
        descriptions: [
          "快速理解陌生语法的速度",
          "阅读别人编写代码的效率",
          "做完错题复盘总结习惯",
          "把旧知识迁移到新场景",
          "主动跟进新技术栈的意愿"
        ],
        options: ["快速掌握", "慢慢学习", "理解困难", "完全看不懂"]
      },
      {
        typeName: "算法意识",
        descriptions: [
          "选出时间复杂度最优解法",
          "将复杂业务拆分成小模块",
          "编写低重复度的模块化代码",
          "减少循环次数进行性能优化",
          "理解分层架构设计思想"
        ],
        options: ["最优解法", "普通写法", "冗余代码", "错误方案"]
      }
    ];
    const insertStmt = db.prepare(`
        INSERT INTO question(type,content,opt_a,opt_b,opt_c,opt_d,answer) VALUES (?,?,?,?,?,?,?)
    `);
    //循环插入500条题目
    for (let i = 1; i <= 500; i++) {
      const idx = i % 5;
      const config = typeConfig[idx];
      const desc = config.descriptions[i % 5];
      const content = `${i}.【${config.typeName}】${desc}`;
      let ans;
      if (i % 5 === 0) ans = 0;
      else if (i % 5 === 1) ans = 1;
      else if (i % 5 === 2) ans = 0;
      else if (i % 5 === 3) ans = 2;
      else ans = 1;
      await insertStmt.bind(
        config.typeName,
        content,
        config.options[0],
        config.options[1],
        config.options[2],
        config.options[3],
        ans
      ).run();
    }
    return Response.json({ success: true, message: "数据表创建完成，500题目导入完毕" });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
