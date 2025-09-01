#!/usr/bin/env node

/**
 * MCP 服务器测试脚本
 * 用于验证服务器的基本功能
 */

const { spawn } = require('child_process');
const readline = require('readline');

// 创建 readline 接口用于交互
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 启动 MCP 服务器
console.log('🚀 启动 MCP 学习管理服务器...\n');
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// 处理服务器输出
server.stdout.on('data', (data) => {
  console.log(`服务器: ${data.toString()}`);
});

server.stderr.on('data', (data) => {
  console.error(`错误: ${data.toString()}`);
});

server.on('close', (code) => {
  console.log(`服务器已退出，代码: ${code}`);
  process.exit(code);
});

// 发送测试请求
async function sendRequest(request) {
  return new Promise((resolve) => {
    server.stdin.write(JSON.stringify(request) + '\n');
    
    // 等待响应
    const handler = (data) => {
      try {
        const response = JSON.parse(data.toString());
        server.stdout.removeListener('data', handler);
        resolve(response);
      } catch (e) {
        // 忽略非 JSON 输出
      }
    };
    
    server.stdout.on('data', handler);
    
    // 超时处理
    setTimeout(() => {
      server.stdout.removeListener('data', handler);
      resolve(null);
    }, 5000);
  });
}

// 测试流程
async function runTests() {
  console.log('\n📝 开始测试...\n');
  
  // 测试 1: 列出可用工具
  console.log('测试 1: 列出可用工具');
  const toolsRequest = {
    jsonrpc: '2.0',
    method: 'tools/list',
    id: 1
  };
  
  const toolsResponse = await sendRequest(toolsRequest);
  if (toolsResponse) {
    console.log('✅ 工具列表:', toolsResponse.result?.tools?.map(t => t.name).join(', '));
  } else {
    console.log('❌ 获取工具列表失败');
  }
  
  // 测试 2: 创建一个 Todo
  console.log('\n测试 2: 创建 Todo');
  const createTodoRequest = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'add_todo',
      arguments: {
        title: '学习 MCP 协议',
        description: '深入理解 Model Context Protocol 的工作原理',
        priority: 'high',
        category: '技术学习'
      }
    },
    id: 2
  };
  
  const createResponse = await sendRequest(createTodoRequest);
  if (createResponse) {
    console.log('✅ Todo 创建成功');
  } else {
    console.log('❌ Todo 创建失败');
  }
  
  // 测试 3: 列出资源
  console.log('\n测试 3: 列出资源');
  const resourcesRequest = {
    jsonrpc: '2.0',
    method: 'resources/list',
    id: 3
  };
  
  const resourcesResponse = await sendRequest(resourcesRequest);
  if (resourcesResponse) {
    console.log('✅ 资源列表:', resourcesResponse.result?.resources?.map(r => r.name).join(', '));
  } else {
    console.log('❌ 获取资源列表失败');
  }
  
  // 测试 4: 列出提示词
  console.log('\n测试 4: 列出提示词');
  const promptsRequest = {
    jsonrpc: '2.0',
    method: 'prompts/list',
    id: 4
  };
  
  const promptsResponse = await sendRequest(promptsRequest);
  if (promptsResponse) {
    console.log('✅ 提示词列表:', promptsResponse.result?.prompts?.map(p => p.name).join(', '));
  } else {
    console.log('❌ 获取提示词列表失败');
  }
  
  console.log('\n✨ 测试完成！');
  
  // 关闭服务器
  server.stdin.end();
  rl.close();
}

// 运行测试
console.log('按 Enter 键开始测试，或输入 "exit" 退出...');
rl.question('', (answer) => {
  if (answer.toLowerCase() === 'exit') {
    console.log('退出测试');
    server.kill();
    rl.close();
    process.exit(0);
  } else {
    runTests();
  }
});
