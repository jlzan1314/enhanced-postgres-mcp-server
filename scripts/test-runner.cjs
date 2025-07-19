#!/usr/bin/env node

/**
 * 测试运行器脚本
 * 用于运行不同类型的测试
 */

const { execSync } = require('child_process');
const path = require('path');

const testTypes = {
  basic: 'tests/basic.test.ts',
  sql: 'tests/sql-builder.test.ts',
  all: 'tests/',
  working: ['tests/basic.test.ts', 'tests/sql-builder.test.ts']
};

function runTest(testPath) {
  try {
    console.log(`\n🧪 运行测试: ${testPath}`);
    console.log('='.repeat(50));
    
    const command = `npx jest ${testPath} --verbose`;
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log(`✅ 测试通过: ${testPath}\n`);
    return true;
  } catch (error) {
    console.log(`❌ 测试失败: ${testPath}\n`);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'working';
  
  console.log('🚀 PostgreSQL MCP Server 测试运行器');
  console.log(`📋 测试类型: ${testType}`);
  
  if (testType === 'working') {
    console.log('🔧 运行稳定的测试用例...');
    let passed = 0;
    let total = testTypes.working.length;
    
    for (const testPath of testTypes.working) {
      if (runTest(testPath)) {
        passed++;
      }
    }
    
    console.log('📊 测试总结:');
    console.log(`   通过: ${passed}/${total}`);
    console.log(`   成功率: ${(passed/total*100).toFixed(1)}%`);
    
    if (passed === total) {
      console.log('🎉 所有稳定测试通过！');
      process.exit(0);
    } else {
      console.log('⚠️  部分测试失败');
      process.exit(1);
    }
  } else if (testTypes[testType]) {
    const testPath = testTypes[testType];
    const success = runTest(testPath);
    process.exit(success ? 0 : 1);
  } else {
    console.log('❌ 未知的测试类型');
    console.log('可用的测试类型:');
    Object.keys(testTypes).forEach(type => {
      console.log(`  - ${type}`);
    });
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}