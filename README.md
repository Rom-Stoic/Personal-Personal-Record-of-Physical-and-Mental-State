# ROM 日常数据记录应用
这是一个基于 Web 的本地应用程序，旨在帮助用户方便地记录和追踪每日的健康、活动和情绪等相关数据。所有数据都会被实时保存到一个本地的 Excel 文件中，便于后续的分析和回顾。

## 功能特性
网页表单: 提供一个结构化的网页表单，覆盖晨间、日间、晚间三大模块的各项指标。

数据持久化: 将表单数据直接保存到本地的 ROM数据模板.xlsx 文件中。

历史数据加载: 选择特定日期时，能自动从 Excel 文件中加载并回填已有数据。

简单反应时测试: 内置一个简单的反应时（SRT）测试小工具。

本地化部署: 完全在本地运行，无需联网，保障数据隐私。

## 文件结构
.
├── app.py                  # Flask 后端主程序

├── index.html              # 前端网页结构

├── script.js               # 前端交互逻辑

├── style.css               # 前端页面样式

└── ROM数据模板.xlsx        # 用于存储数据模板和记录的Excel文件

## 环境配置与安装
在运行此应用前，您需要配置好 Python 环境并安装所需的依赖库。

### 1. 前提条件

已安装 Python 3.6 或更高版本。

确保您的系统已安装 pip (Python 包管理工具)。

### 2. 创建并激活虚拟环境

为了不污染全局 Python 环境，强烈建议您使用虚拟环境。

对于 Windows 用户:

#### 创建一个名为 venv 的虚拟环境
python -m venv venv

#### 激活虚拟环境
.\venv\Scripts\activate

对于 macOS / Linux 用户:

#### 创建一个名为 venv 的虚拟环境
python3 -m venv venv

#### 激活虚拟环境
source venv/bin/activate

激活成功后，您会看到命令行提示符前面出现了 (venv) 字样。

### 3. 创建 requirements.txt 文件

在项目根目录下创建一个名为 requirements.txt 的文件，并将以下内容复制进去。这个文件列出了项目所需的所有 Python 库。

Flask
pandas
openpyxl
numpy

### 4. 安装依赖

在已激活虚拟环境的命令行中，运行以下命令来安装所有必需的库：

pip install -r requirements.txt

## 如何运行程序
确保您已经完成了上述所有环境配置步骤，并且虚拟环境处于激活状态。

确保 ROM数据模板.xlsx 文件与 app.py 在同一个目录下。

在命令行中，运行以下命令来启动 Flask 服务器：

python app.py

您会看到类似以下的输出，表示服务器已成功启动：

Starting Flask server...
Data will be saved to 'C:\path\to\your\project\ROM数据模板.xlsx'
Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.
 * Serving Flask app 'app'
 * Running on [http://127.0.0.1:5000](http://127.0.0.1:5000) (Press CTRL+C to quit)

打开您的浏览器（如 Chrome, Firefox 等），访问 http://127.0.0.1:5000，即可看到应用界面。

## 使用说明
选择日期: 页面加载后，日期默认为当天。您可以通过日期选择框选择任何您想记录或查看的日期。

加载数据: 当您选择一个日期后，程序会自动检查 ROM数据模板.xlsx 文件中是否已存在该日期的数据。如果存在，表单将自动填充这些数据。

填写/修改数据: 您可以在表单中填写新的数据或修改已加载的数据。

保存数据: 完成填写后，点击页面底部的【保存数据到Excel】按钮。程序会将当前表单中的所有数据更新或追加到 Excel 文件中。

停止程序: 当您想关闭程序时，直接在运行服务器的命令行窗口中按下 Ctrl + C 即可。

祝您使用愉快！

