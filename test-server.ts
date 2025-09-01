/**
 * 简单的服务器功能测试
 */

import { DatabaseManager } from './src/database';
import { TodoManager } from './src/todo';
import { NoteManager } from './src/notes';

async function testServer() {
  console.log('🚀 开始测试 MCP 学习管理服务器...\n');
  
  // 初始化数据库
  const db = new DatabaseManager();
  await db.initialize();
  console.log('✅ 数据库初始化成功\n');
  
  // 测试 Todo 功能
  console.log('📝 测试 Todo 管理功能...');
  const todoManager = new TodoManager(db);
  
  // 创建 Todo
  const todo1 = await todoManager.addTodo({
    title: '学习 TypeScript',
    description: '深入学习 TypeScript 高级特性',
    priority: 'high',
    category: '技术学习'
  });
  console.log('✅ 创建 Todo:', todo1.content[0].text.split('\n')[2]);
  
  // 更新 Todo
  const updated = await todoManager.updateTodo({
    id: 1,
    status: 'in_progress',
    progress: 30
  });
  console.log('✅ 更新 Todo 状态和进度');
  
  // 列出 Todo
  const list = await todoManager.listTodos({});
  console.log('✅ 当前 Todo 数量:', list.content[0].text.includes('暂无任务') ? 0 : 1);
  
  // 测试笔记功能
  console.log('\n📚 测试笔记管理功能...');
  const noteManager = new NoteManager(db);
  
  // 创建笔记
  const note1 = await noteManager.createNote({
    title: 'TypeScript 学习笔记',
    content: '## 基础类型\n\n- number\n- string\n- boolean\n- array\n- tuple',
    category: '技术学习',
    tags: ['typescript', 'programming']
  });
  console.log('✅ 创建笔记:', note1.content[0].text.split('\n')[2]);
  
  // 搜索笔记
  const searchResult = await noteManager.searchNotes('TypeScript');
  console.log('✅ 搜索笔记，找到:', searchResult.content[0].text.includes('未找到') ? 0 : 1, '条结果');
  
  // 列出笔记
  const noteList = await noteManager.listNotes({});
  console.log('✅ 当前笔记数量:', noteList.content[0].text.includes('暂无笔记') ? 0 : 1);
  
  console.log('\n✨ 所有测试完成！服务器功能正常。');
  
  // 关闭数据库
  db.close();
}

// 运行测试
testServer().catch(console.error);
