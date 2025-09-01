/**
 * 测试简化后的 Todo 功能
 */

import { DatabaseManager } from './src/database';
import { TodoManager } from './src/todo';

async function testSimplifiedTodos() {
  console.log('🚀 测试简化后的 Todo 功能...\n');
  
  // 初始化数据库
  const db = new DatabaseManager();
  await db.initialize();
  
  const todoManager = new TodoManager(db);
  
  // 测试单个创建（只有标题和优先级）
  console.log('📝 测试单个创建...');
  const todo1 = await todoManager.addTodo({
    title: '学习 React Hooks',
    priority: 'high'
  });
  console.log(todo1.content[0].text);
  
  // 测试批量创建（简化版）
  console.log('\n📝 测试批量创建...');
  const simpleTodos = [
    { title: '复习算法基础', priority: 'high' },
    { title: '练习 LeetCode', priority: 'medium' },
    { title: '阅读技术文档', priority: 'low' }
  ];
  
  const batchResult = await todoManager.addTodos(simpleTodos);
  console.log(batchResult.content[0].text);
  
  // 测试更新
  console.log('\n📝 测试更新任务...');
  const updateResult = await todoManager.updateTodo({
    id: 1,
    status: 'in_progress',
    progress: 50
  });
  console.log(updateResult.content[0].text);
  
  // 查看所有任务
  console.log('\n📋 当前所有任务:');
  const allTodos = await todoManager.listTodos({});
  console.log(allTodos.content[0].text);
  
  console.log('\n✨ 简化版 Todo 测试完成！');
  
  db.close();
}

testSimplifiedTodos().catch(console.error);
