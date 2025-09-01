import { DatabaseManager } from './src/database.js';
import { TodoManager } from './src/todo.js';

async function testDelete() {
  console.log('🧪 测试删除功能的数据持久化...\n');
  
  const db = new DatabaseManager();
  await db.initialize();
  const todoManager = new TodoManager(db);
  
  // 1. 先添加一个测试任务
  console.log('📝 添加测试任务...');
  const addResult = await todoManager.addTodo({
    title: '测试删除任务',
    priority: 'high'
  });
  console.log(addResult.content[0].text);
  
  // 2. 列出所有任务，找到刚添加的任务ID
  console.log('\n📋 查看当前任务列表...');
  const listResult = await todoManager.listTodos({});
  console.log(listResult.content[0].text);
  
  // 3. 提取最新任务的ID（假设是最后一个）
  const database = db.getDb();
  const latestTodo = database.prepare('SELECT * FROM todos ORDER BY id DESC LIMIT 1').get() as any;
  
  if (latestTodo) {
    console.log(`\n🗑️ 删除任务 ID: ${latestTodo.id}...`);
    const deleteResult = await todoManager.deleteTodo(latestTodo.id);
    console.log(deleteResult.content[0].text);
    
    // 4. 再次列出任务，确认删除
    console.log('\n📋 删除后的任务列表...');
    const listAfterDelete = await todoManager.listTodos({});
    console.log(listAfterDelete.content[0].text);
    
    // 5. 直接查询数据库确认
    const deletedTodo = database.prepare('SELECT * FROM todos WHERE id = ?').get(latestTodo.id);
    console.log(`\n🔍 数据库直接查询结果: ${deletedTodo ? '任务仍存在' : '任务已删除'}`);
  }
  
  db.close();
}

testDelete().catch(console.error);
