/**
 * 测试简化后的 MCP 服务器功能
 */

import { DatabaseManager } from './src/database';
import { TodoManager } from './src/todo';

async function testSimplifiedServer() {
  console.log('🚀 测试简化后的 MCP 服务器...\n');
  
  const db = new DatabaseManager();
  await db.initialize();
  const todoManager = new TodoManager(db);
  
  // 测试批量添加任务
  console.log('📝 批量添加学习任务...');
  await todoManager.addTodos([
    { title: '学习 React Hooks', priority: 'high' },
    { title: '练习算法题', priority: 'medium' },
    { title: '阅读设计模式', priority: 'low' }
  ]);
  
  // 测试任务列表
  console.log('\n📋 当前任务列表:');
  const todoList = await todoManager.listTodos({});
  console.log(todoList.content[0].text);
  
  // 测试更新任务
  console.log('\n🔄 更新任务状态...');
  await todoManager.updateTodo({ id: 1, status: 'in_progress', progress: 50 });
  
  // 再次查看列表
  console.log('\n📋 更新后的任务列表:');
  const updatedList = await todoManager.listTodos({});
  console.log(updatedList.content[0].text);
  
  console.log('\n✅ 简化版服务器测试完成！');
  
  db.close();
}

testSimplifiedServer().catch(console.error);
