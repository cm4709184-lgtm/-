# Android APK 构建说明

## ⚠️ 当前状态

构建APK需要安装 **Java Development Kit (JDK)**

## 📥 安装 JDK 17

### 方法一：直接下载（推荐）

1. 访问下载地址：https://adoptium.net/temurin/releases/?version=17
2. 选择 **Windows** → **x64** → **JDK** → **.msi** 或 **.exe** 安装包
3. 下载并安装
4. 安装完成后，重新启动终端

### 方法二：使用包管理器

**如果安装了 scoop：**
```powershell
scoop install openjdk17
```

**如果安装了 chocolatey：**
```powershell
choco install openjdk17 -y
```

## 🔧 设置环境变量

安装JDK后，需要设置 JAVA_HOME 环境变量：

1. 按 `Win + R`，输入 `sysdm.cpl`，回车
2. 点击 **高级** 选项卡 → **环境变量**
3. 在 **系统变量** 中，点击 **新建**：
   - 变量名：`JAVA_HOME`
   - 变量值：`C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot`（根据实际安装路径）
4. 点击 **确定** 保存
5. **重启终端**

## ✅ 构建 APK

设置好JDK后，在项目根目录执行以下命令：

```powershell
cd android
.\gradlew assembleDebug
```

APK文件将生成在：
```
android\app\build\outputs\apk\debug\app-debug.apk
```

## 📱 安装到手机

构建完成后，可以：
1. 将 `app-debug.apk` 复制到手机安装
2. 使用USB连接手机，运行：
   ```powershell
   adb install android\app\build\outputs\apk\debug\app-debug.apk
   ```

## 🔍 验证JDK安装

运行以下命令检查是否安装成功：

```powershell
java -version
echo $env:JAVA_HOME
```

如果显示版本信息（如 `openjdk version "17.x.x"`），则安装成功。

## 📞 常见问题

### Q: 安装后还是提示 JAVA_HOME 未设置？
**A:** 
1. 确认环境变量已正确设置
2. 重启终端或电脑
3. 重新打开终端并再次尝试

### Q: Gradle构建失败？
**A:** 
1. 检查网络连接
2. 确保JDK版本为17
3. 删除 `android/.gradle` 和 `android/app/build` 文件夹后重试

### Q: 手机无法安装APK？
**A:** 
1. 开启手机的"允许安装未知来源应用"
2. 检查手机系统版本是否兼容
3. 尝试安装到模拟器测试
