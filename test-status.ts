/**
 * 测试学习状态概览功能
 */

import { DatabaseManager } from './src/database';
import { TodoManager } from './src/todo';
import { NoteManager } from './src/notes';
import { LearningMCPServer } from './src/index';

async function testStatusOverview() {
  console.log('🚀 测试学习状态概览功能...\n');
  
  // 初始化数据库和管理器
  const db = new DatabaseManager();
  await db.initialize();
  
  const todoManager = new TodoManager(db);
  const noteManager = new NoteManager(db);
  
  // 创建一些测试数据
  console.log('📝 准备测试数据...');
  
  // 添加不同状态和优先级的任务
  await todoManager.addTodos([
    { title: '学习 React', priority: 'high' },
    { title: '练习算法', priority: 'medium' },
    { title: '阅读文档', priority: 'low' }
  ]);
  
  // 更新一个任务为进行中
  await todoManager.updateTodo({ id: 1, status: 'in_progress', progress: 30 });
  
  // 添加一些笔记
  await noteManager.createNote({
    title: 'React 学习笔记',
    content: '## Hooks\n\n- useState\n- useEffect',
    category: '前端开发',
    tags: ['react', 'hooks']
  });
  
  await noteManager.createNote({
    title: '算法笔记',
    content: '## 排序算法\n\n- 快速排序\n- 归并排序',
    category: '算法学习',
    tags: ['algorithm', 'sorting']
  });
  
  console.log('✅ 测试数据准备完成\n');
  
  // 创建 MCP 服务器实例并测试状态概览
  const server = new LearningMCPServer();
  
  // 模拟调用 get_learning_status 工具
  console.log('📊 获取学习状态概览...');
  const statusResult = await (server as any).getLearningStatus();
  
  console.log('\n' + statusResult.content[0].text);
  
  console.log('\n✨ 状态概览测试完成！');
  
  db.close();
}

testStatusOverview().catch(console.error);
