/**
 * 测试批量创建 Todo 功能
 */

import { DatabaseManager } from './src/database';
import { TodoManager } from './src/todo';

async function testBatchTodos() {
  console.log('🚀 测试批量创建学习任务...\n');
  
  // 初始化数据库
  const db = new DatabaseManager();
  await db.initialize();
  
  const todoManager = new TodoManager(db);
  
  // 模拟对话开始时制定的学习清单
  const learningPlan = [
    {
      title: '学习民法基础理论',
      description: '掌握民法的基本概念、原则和体系结构',
      priority: 'high',
      category: '民法学习'
    },
    {
      title: '研读民法典物权编',
      description: '深入理解物权的概念、种类和保护制度',
      priority: 'high',
      category: '民法学习'
    },
    {
      title: '学习合同法律制度',
      description: '掌握合同的订立、履行、变更和解除',
      priority: 'medium',
      category: '民法学习'
    },
    {
      title: '深度学习基础',
      description: '学习神经网络、反向传播算法',
      priority: 'high',
      category: '深度学习'
    },
    {
      title: '实现CNN图像分类',
      description: '使用PyTorch实现卷积神经网络',
      priority: 'medium',
      category: '深度学习'
    },
    {
      title: '量化策略研究',
      description: '研究因子模型和回测框架',
      priority: 'medium',
      category: '量化投资'
    }
  ];
  
  // 批量创建任务
  const result = await todoManager.addTodos(learningPlan);
  console.log('批量创建结果:');
  console.log(result.content[0].text);
  
  // 验证创建结果
  const allTodos = await todoManager.listTodos({});
  console.log('\n📋 当前所有任务:');
  console.log(allTodos.content[0].text);
  
  // 按分类查看
  console.log('\n🏷️ 按分类查看:');
  const categories = ['民法学习', '深度学习', '量化投资'];
  
  for (const category of categories) {
    const categoryTodos = await todoManager.listTodos({ category });
    console.log(`\n**${category}**:`);
    if (categoryTodos.content[0].text.includes('暂无任务')) {
      console.log('  暂无任务');
    } else {
      const lines = categoryTodos.content[0].text.split('\n');
      const todoCount = lines.filter(line => line.includes('**')).length;
      console.log(`  ${todoCount} 个任务`);
    }
  }
  
  console.log('\n✨ 批量创建测试完成！');
  
  db.close();
}

testBatchTodos().catch(console.error);
