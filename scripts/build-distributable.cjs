const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const version = process.argv[2] || '1.0.0';

console.log('=================================');
console.log('  课表解析应用构建脚本');
console.log('=================================');
console.log('版本:', version);
console.log('');

try {
  // 步骤1: 构建前端
  console.log('[1/3] 正在构建前端资源...');
  execSync('npm run build', { 
    cwd: process.cwd(),
    stdio: 'inherit'
  });
  console.log('✓ 前端构建完成');
  console.log('');

  // 步骤2: 安装electron-builder (如果需要)
  console.log('[2/3] 检查打包工具...');
  try {
    execSync('npx electron-builder --version', { 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    console.log('✓ electron-builder 已安装');
  } catch (e) {
    console.log('正在安装 electron-builder...');
    execSync('npm install -D electron-builder', { 
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    console.log('✓ electron-builder 安装完成');
  }
  console.log('');

  // 步骤3: 打包应用
  console.log('[3/3] 正在打包应用...');
  const outputDir = `release-${version}`;
  
  // 创建输出目录配置
  const config = {
    appId: 'com.schedule.app',
    productName: '课表解析应用',
    directories: {
      output: outputDir
    },
    files: [
      'dist/**/*',
      'electron/**/*',
      'package.json'
    ],
    asar: false,
    win: {
      target: [
        {
          target: 'portable',
          arch: ['x64']
        }
      ]
    },
    portable: {
      artifactName: '课表解析应用-${version}-win64.${ext}'
    }
  };

  // 写入临时配置
  fs.writeFileSync(
    'electron-builder-temp.json',
    JSON.stringify(config, null, 2)
  );

  execSync(`npx electron-builder --win --config electron-builder-temp.json`, {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  // 删除临时配置
  fs.unlinkSync('electron-builder-temp.json');

  console.log('');
  console.log('=================================');
  console.log('  ✓ 构建成功！');
  console.log('=================================');
  console.log('');
  console.log('输出目录:', path.join(process.cwd(), outputDir));
  console.log('可执行文件: 课表解析应用.exe');
  console.log('');
  console.log('使用说明:');
  console.log('1. 进入输出目录');
  console.log('2. 双击 "课表解析应用.exe" 运行');
  console.log('');

} catch (error) {
  console.error('');
  console.error('=================================');
  console.error('  ✗ 构建失败！');
  console.error('=================================');
  console.error('');
  console.error('错误信息:', error.message);
  console.error('');
  process.exit(1);
}
