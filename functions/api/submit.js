export async function onRequestPost({ request, env }) {
    const { score } = await request.json();
    if(isNaN(score) || score<0 || score>100){
        return Response.json({success:false,msg:"分数非法"},{status:400});
    }
    const db = env.DB;
    // 原子更新，避免并发数据错乱
    await db.prepare(`
        UPDATE stat SET total_users = total_users + 1, total_score = total_score + ? WHERE id = 1
    `).bind(score).run();

    const { total_users, total_score } = await db.prepare("SELECT total_users,total_score FROM stat WHERE id =1").first();
    const avg = (total_score / total_users).toFixed(2);
    return Response.json({
        success:true,
        total_users,
        avg_score:avg
    })
}

// 获取全局统计
export async function onRequestGet({env}){
    const row = await env.DB.prepare("SELECT total_users,total_score FROM stat WHERE id =1").first();
    const avg = (row.total_score / row.total_users).toFixed(2);
    return Response.json({
        total_users:row.total_users,
        avg_score:avg
    })
}
