import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useScheduleStore } from '../store/scheduleStore';
import { useThemeStore } from '../store/themeStore';
import { ScheduleGrid } from '../components/ScheduleGrid';
import { TimetableView } from '../components/TimetableView';
import { WeekSelector } from '../components/WeekSelector';
import { FileUploader } from '../components/FileUploader';
import { NextClassFinder } from '../components/NextClassFinder';
import { doGet, doPost, mergeJar, rawRequest, updateWidget, isNetworkError } from '../plugins/HttpHelper';
import { parseExcelBuffer } from '../utils/excelParser';
import { getCurrentWeek } from '../utils/dateUtils';
import { Calendar, User, Lock, RefreshCw, Settings, X, ExternalLink, Sun, Moon } from 'lucide-react';
import { Browser } from '@capacitor/browser';

type UploadMode = 'upload' | 'guide' | 'login';

export default function Home() {
  const {
    schedule, selectedWeek, isLoading, error,
    semesterStart, semesterLabel, skipPromptUntil, lastUpdated,
    setSchedule, setSelectedWeek, parseExcelFile, reset,
    setSemesterStart, snoozeSemesterPrompt,
  } = useScheduleStore();

  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  const [widgetFontSize, setWidgetFontSize] = useState('md');
  const [widgetOpacity, setWidgetOpacity] = useState(90);
  const [bgImage, setBgImage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('widget-settings');
      if (stored) {
        const s = JSON.parse(stored);
        if (s.fontSize) setWidgetFontSize(s.fontSize);
        if (s.opacity) setWidgetOpacity(parseInt(s.opacity) || 90);
      }
      const savedBg = localStorage.getItem('app-background');
      if (savedBg) setBgImage(savedBg);
    } catch {}
  }, []);

  const saveWidgetSettings = useCallback((settings: any) => {
    const stored = localStorage.getItem('widget-settings');
    const current = stored ? JSON.parse(stored) : {};
    const updated = { ...current, ...settings };
    localStorage.setItem('widget-settings', JSON.stringify(updated));
    try { window.NB?.updateWidgetSettings(JSON.stringify(settings)); } catch {}
  }, []);

  const handleBgUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setBgImage(dataUrl);
      localStorage.setItem('app-background', dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleBgRemove = useCallback(() => {
    setBgImage(null);
    localStorage.removeItem('app-background');
  }, []);

  const acrylicText = bgImage ? 'text-white' : '';
  const acrylicBorder = bgImage ? 'border border-white/25' : '';
  const acrylicCard = bgImage
    ? `bg-black/20 ${acrylicBorder}`
    : 'bg-white';
  const acrylicBtnPrimary = bgImage
    ? `bg-transparent border border-blue-400/50 ${acrylicText} hover:bg-blue-500/10`
    : 'bg-blue-500 text-white hover:bg-blue-600';
  const acrylicInput = bgImage
    ? `bg-transparent border border-white/30 ${acrylicText}`
    : 'border border-slate-200';

  const actualCurrentWeek = useMemo(() => {
    if (!schedule) return selectedWeek;
    return getCurrentWeek(semesterStart, schedule.totalWeeks);
  }, [semesterStart, schedule, selectedWeek]);

  const updateScheduleWithWidget = useCallback((scheduleData: any) => {
    setSchedule(scheduleData);
    try {
      const widgetData = {
        ...scheduleData,
        semesterStart: semesterStart,
      };
      updateWidget(JSON.stringify(widgetData));
    } catch (e) {
      console.error('Widget update failed:', e);
    }
  }, [setSchedule, semesterStart]);

  useEffect(() => {
    if (schedule) {
      try {
        const widgetData = {
          ...schedule,
          semesterStart: semesterStart,
        };
        updateWidget(JSON.stringify(widgetData));
      } catch (e) {
        console.error('Widget update on semesterStart change failed:', e);
      }
    }
  }, [semesterStart]);

  const [mode, setMode] = useState<UploadMode>('upload');
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    return (localStorage.getItem('viewMode') as 'card' | 'table') || 'card';
  });
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [semesterName, setSemesterName] = useState(semesterLabel);
  const [semesterDate, setSemesterDate] = useState(semesterStart);
  const [loginUsername, setLoginUsername] = useState(() => localStorage.getItem('loginUsername') || '');
  const [loginPassword, setLoginPassword] = useState(() => localStorage.getItem('loginPassword') || '');
  const [loginCaptcha, setLoginCaptcha] = useState('');
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLogs, setLoginLogs] = useState<string[]>([]);
  const [loginProgress, setLoginProgress] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [autoCheckDone, setAutoCheckDone] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const [versionClicks, setVersionClicks] = useState(0);
  const autoRefreshed = useRef(false);

  useEffect(() => {
    if (schedule) {
      const curr = getCurrentWeek(semesterStart, schedule.totalWeeks);
      setSelectedWeek(curr);
    }
  }, [schedule, semesterStart, setSelectedWeek]);

  const checkSessionAndRefresh = useCallback(async () => {
    const savedSession = localStorage.getItem('loginSession');
    const savedUsername = localStorage.getItem('loginUsername');
    const savedPassword = localStorage.getItem('loginPassword');

    if (!savedSession || !savedUsername || !savedPassword) return 'no-credentials' as const;

    try {
      const r = doGet('/jsxsd/xskb/xskb_list.do', savedSession);
      const html = new TextDecoder('gbk').decode(r.data);
      if (!html.includes('kbtable') && html.includes('USERNAME')) {
        localStorage.removeItem('loginSession');
        return 'session-expired' as const;
      }
      return 'valid' as const;
    } catch (e) {
      if (isNetworkError(e)) return 'network-error' as const;
    }

    localStorage.removeItem('loginSession');
    return 'session-expired' as const;
  }, []);

  const addLog = useCallback((msg: string) => {
    setLoginLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const captchaJar = useRef('');

  const fetchCaptcha = useCallback(async () => {
    setLoginError(null);
    try {
      addLog('请求会话...');
      const raw1 = rawRequest('GET', '/jsxsd/', '', '');
      addLog('会话原始: ' + raw1.substring(0, 100));

      const r1 = doGet('/jsxsd/');
      captchaJar.current = r1.cookie;
      addLog('会话: ' + r1.cookie);

      addLog('请求验证码...');
      const raw2 = rawRequest('GET', '/jsxsd/verifycode.servlet', '', r1.cookie);
      addLog('验证码原始len=' + raw2.length + '): ' + raw2.substring(0, 80));

      const r2 = doGet('/jsxsd/verifycode.servlet', r1.cookie);
      addLog('验证码数据: ' + r2.data.length + '字节');

      if (r2.data.length === 0) {
        throw new Error('验证码数据为空');
      }
      const b64 = btoa(String.fromCharCode(...r2.data));
      setCaptchaImage(`data:image/gif;base64,${b64}`);
      addLog('验证码OK');
    } catch (e) {
      addLog('验证码失败: ' + (e instanceof Error ? e.message : String(e)));
      setLoginError('验证码获取失败');
    }
  }, [addLog]);

  useEffect(() => {
    if (autoCheckDone || autoRefreshed.current) return;
    
    const savedUsername = localStorage.getItem('loginUsername') || '';
    const savedPassword = localStorage.getItem('loginPassword') || '';
    const savedSession = localStorage.getItem('loginSession') || '';
    const lastRefresh = localStorage.getItem('lastRefreshDate') || '';
    const today = new Date().toISOString().split('T')[0];
    const needAutoRefresh = savedSession && savedUsername && savedPassword && lastRefresh !== today;

    if (savedSession && savedUsername && savedPassword) {
      autoRefreshed.current = true;
      setIsLoggingIn(true);
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      checkSessionAndRefresh().then(status => {
        setIsLoggingIn(false);
        setAutoCheckDone(true);
        if (status === 'network-error') {
          setLoginError('无法连接校园网，请连接后重试');
          return;
        }
        if (status === 'session-expired' || status === 'no-credentials') {
          setMode('login');
          setLoginUsername(savedUsername);
          setLoginPassword(savedPassword);
          fetchCaptcha();
        } else if (needAutoRefresh) {
          const autoRefresh = async () => {
            const savedSessionNow = localStorage.getItem('loginSession');
            if (!savedSessionNow) return;

            try {
              const r = doGet('/jsxsd/xskb/xskb_list.do', savedSessionNow);
              const html = new TextDecoder('gbk').decode(r.data);

              if (!html.includes('kbtable') && html.includes('USERNAME')) {
                localStorage.removeItem('loginSession');
                return;
              }

              let semesterId = '2025-2026-2';
              const semMatch = html.match(/<option[^>]*value="(\d{4}-\d{4}-\d)"[^>]*selected/i);
              if (semMatch) semesterId = semMatch[1];
              const jar = mergeJar(savedSessionNow, r.cookie);
              const xlsR = doPost('/jsxsd/xskb/xskb_print.do?xnxq01id=' + semesterId + '&zc=', '', jar);
              if (xlsR.data[0] === 0xD0 && xlsR.data[1] === 0xCF && xlsR.data.length > 1000) {
                const parsed = parseExcelBuffer(xlsR.data.buffer);
                updateScheduleWithWidget(parsed);
                localStorage.setItem('lastRefreshDate', today);
                localStorage.setItem('loginSession', mergeJar(jar, xlsR.cookie));
              }
            } catch (e) {
              if (isNetworkError(e)) {
                setLoginError('无法连接校园网，课表未更新');
              }
            }
          };
          timeoutId = setTimeout(autoRefresh, 500);
        }
      });
      
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    } else {
      setAutoCheckDone(true);
    }
  }, [autoCheckDone, checkSessionAndRefresh, fetchCaptcha, updateScheduleWithWidget]);

  const daysSinceUpdate = useMemo(() => {
    if (!lastUpdated) return null;
    return Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 86400000);
  }, [lastUpdated]);

  const semesterConfigFinished = useMemo(() => {
    if (!schedule || skipPromptUntil && new Date() < new Date(skipPromptUntil)) return false;
    const allWeeks = schedule.courses.flatMap(c => c.weeks);
    if (allWeeks.length === 0) return false;
    const lastWeek = Math.max(...allWeeks);
    const currentWeek = getCurrentWeek(semesterStart, schedule.totalWeeks);
    return currentWeek > lastWeek;
  }, [schedule, semesterStart, skipPromptUntil]);

  const handleAutoLogin = useCallback(async () => {
    if (!loginUsername || !loginPassword || !loginCaptcha) {
      setLoginError('请填写完整的登录信息');
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);
    setLoginLogs([]);
    setLoginProgress('正在登录...');
    localStorage.setItem('loginUsername', loginUsername);
    localStorage.setItem('loginPassword', loginPassword);

    try {
      let jar = captchaJar.current;

      // 步骤1: 登录
      setLoginProgress('登录验证中...');
      const loginBody = `USERNAME=${loginUsername}&PASSWORD=${encodeURIComponent(loginPassword)}&RANDOMCODE=${loginCaptcha}`;
      const s2 = doPost('/jsxsd/xk/LoginToXk', loginBody, jar);
      jar = mergeJar(jar, s2.cookie);

      const loginText = new TextDecoder('gbk').decode(s2.data);
      if (loginText.includes('USERNAME') && !loginText.includes('main.jsp')) {
        addLog('登录失败');
        setLoginError('用户名、密码或验证码错误');
        setLoginProgress('');
        setIsLoggingIn(false);
        setLoginCaptcha('');
        fetchCaptcha();
        return;
      }

      // 步骤2: 获取课表页面
      setLoginProgress('获取课表页面...');
      const s4 = doGet('/jsxsd/xskb/xskb_list.do', jar);
      const html = new TextDecoder('gbk').decode(s4.data);
      jar = mergeJar(jar, s4.cookie);

      let semesterId = '2025-2026-2';
      const semMatch = html.match(/<option[^>]*value="(\d{4}-\d{4}-\d)"[^>]*selected/i);
      if (semMatch) semesterId = semMatch[1];

      // 步骤3: 下载XLS
      setLoginProgress('下载课表数据...');
      const s3 = doPost('/jsxsd/xskb/xskb_print.do?xnxq01id=' + semesterId + '&zc=', '', jar);
      jar = mergeJar(jar, s3.cookie);

      if (s3.data[0] === 0xD0 && s3.data[1] === 0xCF && s3.data.length > 1000) {
        setLoginProgress('解析课表...');
        const parsed = parseExcelBuffer(s3.data.buffer);
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('lastRefreshDate', today);
        localStorage.setItem('loginSession', jar);
        updateScheduleWithWidget(parsed);
        setLoginProgress('');
        addLog('🎉 成功！课程' + parsed.courses.length + '门，当前第' + parsed.currentWeek + '周');
      } else {
        addLog('❌XLS格式错误');
        setLoginError('下载课表失败');
        setLoginProgress('');
      }
    } catch (e) {
      if (isNetworkError(e)) {
        addLog('无法连接校园网');
        setLoginError('无法连接校园网，请连接后重试');
      } else {
        addLog('错误: ' + (e instanceof Error ? e.message : String(e)));
        setLoginError('操作失败');
      }
    } finally {
      setIsLoggingIn(false);
    }
  }, [loginUsername, loginPassword, loginCaptcha, updateScheduleWithWidget, addLog, fetchCaptcha]);

  const handleRefresh = useCallback(async () => {
    const savedSession = localStorage.getItem('loginSession');
    if (!savedSession) {
      setMode('login');
      fetchCaptcha();
      return;
    }
    setIsLoggingIn(true);
    setLoginLogs([]);
    setLoginProgress('检查会话...');
    try {
      const r = doGet('/jsxsd/xskb/xskb_list.do', savedSession);
      const html = new TextDecoder('gbk').decode(r.data);

      let semesterId = '2025-2026-2';
      const semMatch = html.match(/<option[^>]*value="(\d{4}-\d{4}-\d)"[^>]*selected/i);
      if (semMatch) semesterId = semMatch[1];

      setLoginProgress('下载课表...');
      const xlsR = doPost('/jsxsd/xskb/xskb_print.do?xnxq01id=' + semesterId + '&zc=', '', mergeJar(savedSession, r.cookie));

      if (xlsR.data[0] === 0xD0 && xlsR.data[1] === 0xCF && xlsR.data.length > 1000) {
        setLoginProgress('解析课表...');
        const parsed = parseExcelBuffer(xlsR.data.buffer);
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('lastRefreshDate', today);
        localStorage.setItem('loginSession', mergeJar(savedSession, xlsR.cookie));
        updateScheduleWithWidget(parsed);
        setLoginProgress('');
        addLog('✅成功！课程' + parsed.courses.length + '门，当前第' + parsed.currentWeek + '周');
      } else {
        addLog('✅非XLS格式');
        setLoginProgress('');
      }
    } catch (e) {
      if (isNetworkError(e)) {
        setLoginLogs(prev => [...prev, '[错误]无法连接校园网，请检查网络']);
        setLoginProgress('');
      } else {
        setLoginLogs(prev => [...prev, `[错误]${e instanceof Error ? e.message : String(e)}`]);
        localStorage.removeItem('loginSession');
        setMode('login');
        setLoginUsername(localStorage.getItem('loginUsername') || '');
        setLoginPassword(localStorage.getItem('loginPassword') || '');
        fetchCaptcha();
        setLoginProgress('');
      }
    } finally {
      setIsLoggingIn(false);
    }
  }, [updateScheduleWithWidget, addLog, fetchCaptcha, setMode, setLoginUsername, setLoginPassword]);

  const handleFileUpload = useCallback((file: File) => {
    parseExcelFile(file);
  }, [parseExcelFile]);

  const openBrowser = useCallback(async () => {
    try { await Browser.open({ url: 'http://newjwxt.bjfu.edu.cn/jsxsd/xskb/xskb_list.do', toolbarColor: '#1e40af' }); } catch {}
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 relative ${
      !bgImage && (isDark
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50')
    }`}>
      {bgImage && (
        <>
          <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgImage})` }} />
          <div className={`fixed inset-0 z-0 ${isDark ? 'bg-black/30' : 'bg-black/10'}`} />
        </>
      )}
      <header className={`py-4 px-4 shadow-sm sticky top-0 z-10 transition-colors duration-300 ${
        bgImage
          ? 'bg-black/30 border-b border-white/20 acrylicText'
          : isDark ? 'bg-slate-900/80 text-white' : 'bg-white/80 text-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <Calendar className={`w-6 h-6 ${bgImage ? 'text-white' : isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h1 className="text-xl font-bold">课表解析</h1>
        </div>
      </header>

      <main className="p-4 pb-20 relative z-[1]">
        {!schedule ? (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="flex gap-2 mb-4">
              {(['upload', 'login', 'guide'] as UploadMode[]).map(m => (
                <button key={m}
                  onClick={() => { setMode(m); if (m === 'login' && !captchaImage) fetchCaptcha(); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === m ? (bgImage ? 'bg-transparent border border-blue-400/50 acrylicText' : 'bg-blue-600 text-white shadow-sm') : (bgImage ? 'acrylicText' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50')}`}
                >
                  {m === 'upload' ? '上传文件' : m === 'login' ? '自动登录' : '使用教程'}
                </button>
              ))}
            </div>

            {mode === 'upload' && (
              <>
                <FileUploader onFileUpload={handleFileUpload} isLoading={isLoading} acrylic={!!bgImage} />
                {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}
              </>
            )}

            {mode === 'login' && (
              <div className={`${acrylicCard} rounded-2xl shadow-sm p-6`}>
                <div className={`mb-4 p-3 rounded-xl ${bgImage ? 'bg-white/10 border border-white/20' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
                  <p className={`text-sm font-medium ${bgImage ? 'text-white' : 'text-blue-800'}`}>自动登录教务系统</p>
                  <p className={`text-xs mt-0.5 ${bgImage ? 'text-white/80' : 'text-blue-600'}`}>输入账号密码和验证码，自动获取课表</p>
                </div>

                <form onSubmit={e => { e.preventDefault(); handleAutoLogin(); }} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${bgImage ? 'acrylicText' : 'text-slate-700'}`}>学号</label>
                    <div className="relative">
                      <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${bgImage ? 'acrylicText' : 'text-slate-400'}`} />
                      <input type="text" value={loginUsername} onChange={e => setLoginUsername(e.target.value)}
                        placeholder="请输入学号" disabled={isLoggingIn}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${bgImage ? acrylicInput : 'border border-slate-200'}`} />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${bgImage ? 'acrylicText' : 'text-slate-700'}`}>密码</label>
                    <div className="relative">
                      <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${bgImage ? 'acrylicText' : 'text-slate-400'}`} />
                      <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                        placeholder="请输入密码" disabled={isLoggingIn} autoComplete="off"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${bgImage ? acrylicInput : 'border border-slate-200'}`} />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${bgImage ? 'acrylicText' : 'text-slate-700'}`}>验证码</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value={loginCaptcha} onChange={e => setLoginCaptcha(e.target.value)}
                        placeholder="验证码" disabled={isLoggingIn} maxLength={6} autoComplete="off"
                        className={`flex-1 px-3 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${bgImage ? acrylicInput : 'border border-slate-200'}`} />
                      {captchaImage ? (
                        <img src={captchaImage} alt="验证码" onClick={() => fetchCaptcha()}
                          className="h-10 w-24 rounded-lg border border-slate-200 cursor-pointer object-cover" />
                      ) : (
                        <button type="button" onClick={() => fetchCaptcha()} disabled={isLoggingIn}
                          className="h-10 w-24 rounded-lg bg-slate-100 text-xs text-slate-500 flex items-center justify-center hover:bg-slate-200">
                          获取验证码
                        </button>
                      )}
                    </div>
                    <button type="button" onClick={() => fetchCaptcha()}
                      className="mt-1 text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />换一张验证码
                    </button>
                  </div>

                  {loginError && <div className={`p-3 rounded-xl text-sm ${bgImage ? 'bg-red-500/20 border border-red-400/50 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'}`}>{loginError}</div>}

                  {loginProgress && (
                    <div className={`rounded-xl p-4 ${bgImage ? 'bg-white/10 border border-white/20' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgImage ? 'bg-white/20' : 'bg-blue-100'}`}>
                          <RefreshCw className={`w-4 h-4 animate-spin ${bgImage ? 'text-white' : 'text-blue-600'}`} />
                        </div>
                        <span className={`text-sm font-medium ${bgImage ? 'text-white' : 'text-blue-700'}`}>{loginProgress}</span>
                      </div>
                      <div className={`w-full rounded-full h-1.5 overflow-hidden ${bgImage ? 'bg-white/20' : 'bg-blue-200'}`}>
                        <div className={`h-full rounded-full animate-pulse ${bgImage ? 'bg-white' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                          style={{ transition: 'width 500ms ease' }}></div>
                      </div>
                    </div>
                  )}

                  {developerMode && loginLogs.length > 0 && (
                    <div className="mt-4 p-3 bg-slate-800 rounded-xl text-xs font-mono text-green-400 whitespace-pre-wrap max-h-48 overflow-auto">
                      <p className="text-yellow-400 mb-2 font-bold">🔧 [开发者日志]</p>
                      {loginLogs.join('\n')}
                    </div>
                  )}

                  <button type="submit" disabled={isLoggingIn}
                    className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                      isLoggingIn
                        ? 'bg-amber-400 text-white cursor-wait'
                        : bgImage
                          ? 'bg-transparent border border-blue-400/50 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 active:scale-95'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg active:scale-95'
                    }`}
                    style={{ transition: 'background-color 300ms ease, transform 100ms ease' }}>
                    {isLoggingIn ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        <User className="w-5 h-5" />
                        自动登录获取课表
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {mode === 'guide' && (
              <div className={`${acrylicCard} rounded-2xl shadow-sm p-6 space-y-4`}>
                <div className={`p-4 rounded-xl ${bgImage ? 'bg-white/10 border border-white/20' : 'bg-blue-50'}`}>
                  <p className={`text-sm font-medium ${bgImage ? 'text-white' : 'text-blue-800'}`}>如何获取课表文件？</p>
                  <p className={`text-xs mt-0.5 ${bgImage ? 'text-white/80' : 'text-blue-600'}`}>推荐使用"自动登录"功能，或在浏览器中手动下载课表Excel</p>
                </div>
                <div className="space-y-3">
                  {[
                    { n: 1, t: '打开教务系统', d: '点击下方按钮打开教务系统页面' },
                    { n: 2, t: '登录并进入课表', d: '输入学号密码，导航到"我的课表→本人课表"' },
                    { n: 3, t: '点击导出下载Excel', d: '在课表页面点击"导出"按钮下载课表文件' },
                    { n: 4, t: '回到应用上传', d: '切换到"上传文件"选择下载的Excel即可' },
                  ].map(s => (
                    <div key={s.n} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${bgImage ? 'bg-white/20' : 'bg-blue-100'}`}>
                        <span className={`text-sm font-bold ${bgImage ? 'text-white' : 'text-blue-600'}`}>{s.n}</span>
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${bgImage ? 'acrylicText' : 'text-slate-700'}`}>{s.t}</p>
                        <p className={`text-xs mt-0.5 ${bgImage ? 'acrylicText' : 'text-slate-500'}`}>{s.d}</p>
                      </div>
                    </div>
                  ))}
                  <button onClick={openBrowser}
                    className={`w-full py-3 rounded-xl font-medium hover:shadow-lg flex items-center justify-center gap-2 ${bgImage ? acrylicBtnPrimary : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'}`}>
                    <ExternalLink className="w-5 h-5" /><span>打开教务系统</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {semesterConfigFinished && (
              <div className={`rounded-2xl p-4 ${bgImage ? 'bg-white/10 border border-white/20' : 'bg-amber-50 border border-amber-200'}`}>
                <p className={`text-sm font-medium mb-2 ${bgImage ? 'text-white' : 'text-amber-800'}`}>本学期课程已全部结束</p>
                <p className={`text-xs mb-3 ${bgImage ? 'text-white/80' : 'text-amber-600'}`}>当前学期：{semesterLabel}（{semesterStart}）</p>
                <div className="flex gap-2">
                  <button onClick={() => { setSemesterName(semesterLabel); setSemesterDate(semesterStart); setShowSemesterModal(true); }}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium ${bgImage ? `bg-transparent border border-amber-400/50 ${acrylicText}` : 'bg-amber-500 text-white'}`}>设置新学期日期</button>
                  <button onClick={() => snoozeSemesterPrompt()} className={`py-2 px-3 rounded-xl text-sm ${bgImage ? 'bg-white/10 text-white' : 'bg-amber-100 text-amber-700'}`}>一个月内不再提醒</button>
                </div>
              </div>
            )}

            {daysSinceUpdate !== null && daysSinceUpdate >= 7 && !semesterConfigFinished && (
              <div className={`rounded-2xl p-4 ${bgImage ? 'bg-white/10 border border-white/20' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${bgImage ? 'text-white' : 'text-blue-800'}`}>已{daysSinceUpdate}天未更新</p>
                    <p className={`text-xs mt-0.5 ${bgImage ? 'text-white/80' : 'text-blue-600'}`}>建议刷新课表</p>
                  </div>
                  <button onClick={() => { reset(); setMode('login'); }}
                    className={`py-2 px-4 rounded-xl text-sm font-medium flex items-center gap-1.5 ${bgImage ? 'bg-transparent border border-blue-400/50 acrylicText' : 'bg-blue-500 text-white'}`}>
                    <RefreshCw className="w-4 h-4" />一键刷新
                  </button>
                </div>
              </div>
            )}

            <div className={`${acrylicCard} rounded-2xl shadow-sm p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs ${bgImage ? 'acrylicText' : 'text-slate-500'}`}>
                  {semesterLabel}
                  {lastUpdated && (
                    <span className="ml-1">· 更新于{(() => {
                      const d = new Date(lastUpdated);
                      const today = new Date();
                      const isToday = d.toDateString() === today.toDateString();
                      if (isToday) {
                        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                      } else {
                        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                      }
                    })()}</span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={toggleTheme}
                    className={`p-1.5 rounded-lg transition-colors ${bgImage ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                    title={isDark ? '切换到浅色模式' : '切换到深色模式'}>
                    {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
                  </button>
                  <button onClick={() => { setSemesterName(semesterLabel); setSemesterDate(semesterStart); setShowSemesterModal(true); }}
                    className={`p-1 rounded-lg ${bgImage ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}><Settings className="w-4 h-4 text-slate-400" /></button>
                </div>
              </div>
              <WeekSelector currentWeek={selectedWeek} totalWeeks={schedule.totalWeeks} onWeekChange={setSelectedWeek} acrylic={!!bgImage} />
            </div>

            <NextClassFinder courses={schedule.courses} currentWeek={actualCurrentWeek} acrylic={!!bgImage} />

            {schedule.courses.length === 0
              ? <div className={`text-center py-12 ${acrylicCard} rounded-2xl shadow-sm`}><p className={bgImage ? 'acrylicText' : 'text-slate-500'}>当前周没有课程</p></div>
              : <>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => { setViewMode('card'); localStorage.setItem('viewMode', 'card'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        viewMode === 'card'
                          ? (bgImage ? 'bg-transparent border border-blue-400/50 acrylicText' : 'bg-blue-500 text-white')
                          : (bgImage ? 'acrylicText hover:text-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                      }`}>
                      卡片
                    </button>
                    <button onClick={() => { setViewMode('table'); localStorage.setItem('viewMode', 'table'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        viewMode === 'table'
                          ? (bgImage ? 'bg-transparent border border-blue-400/50 acrylicText' : 'bg-blue-500 text-white')
                          : (bgImage ? 'acrylicText hover:text-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                      }`}>
                      课表
                    </button>
                  </div>
                  {viewMode === 'card'
                    ? <ScheduleGrid courses={schedule.courses} selectedWeek={selectedWeek} acrylic={!!bgImage} />
                    : <TimetableView courses={schedule.courses} selectedWeek={selectedWeek} acrylic={!!bgImage} />
                  }
                </>
            }

            <div className="flex gap-2">
              <button onClick={handleRefresh} disabled={isLoggingIn}
                className={`flex-1 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                  isLoggingIn
                    ? 'bg-amber-400 text-white cursor-wait'
                    : bgImage
                      ? 'bg-transparent border border-white/30 acrylicText hover:bg-white/10 active:scale-95'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95'
                }`}
                style={{ transition: 'background-color 300ms ease, transform 100ms ease' }}>
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    刷新中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    刷新课表
                  </>
                )}
              </button>
            </div>

            {loginProgress && (
              <div className={`rounded-xl p-4 ${bgImage ? 'bg-white/10 border border-white/20' : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgImage ? 'bg-white/20' : 'bg-green-100'}`}>
                    <RefreshCw className={`w-4 h-4 animate-spin ${bgImage ? 'text-white' : 'text-green-600'}`} />
                  </div>
                  <span className={`text-sm font-medium ${bgImage ? 'text-white' : 'text-green-700'}`}>{loginProgress}</span>
                </div>
                <div className={`w-full rounded-full h-1.5 overflow-hidden ${bgImage ? 'bg-white/20' : 'bg-green-200'}`}>
                  <div className={`h-full rounded-full animate-pulse ${bgImage ? 'bg-white' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}
                    style={{ width: '100%', transition: 'width 500ms ease' }}></div>
                </div>
              </div>
            )}

            {developerMode && loginLogs.length > 0 && (
              <div className="p-3 bg-slate-800 rounded-xl text-xs font-mono text-green-400 whitespace-pre-wrap max-h-32 overflow-auto">
                <p className="text-yellow-400 mb-2 font-bold">🔧 [开发者日志]</p>
                {loginLogs.join('\n')}
              </div>
            )}
          </div>
        )}
      </main>

      {showSemesterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className={`${acrylicCard} rounded-2xl w-full max-w-md p-6 space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-bold ${bgImage ? 'acrylicText' : 'text-slate-800'}`}>学期设置</h2>
              <button onClick={() => setShowSemesterModal(false)} className="p-1"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${bgImage ? 'acrylicText' : 'text-slate-700'}`}>学期名称</label>
              <input type="text" value={semesterName} onChange={e => setSemesterName(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${bgImage ? acrylicInput : 'border border-slate-200'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${bgImage ? 'acrylicText' : 'text-slate-700'}`}>第一周周一日期</label>
              <input type="date" value={semesterDate} onChange={e => setSemesterDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${bgImage ? acrylicInput : 'border border-slate-200'}`} />
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4">
              <h3 className={`text-sm font-medium mb-3 ${bgImage ? 'acrylicText' : 'text-slate-700'}`}>🖼️ 自定义背景</h3>
              <div className="space-y-3">
                {bgImage ? (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg border border-slate-200 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
                    <div className="flex-1">
                      <p className={`text-xs ${bgImage ? 'acrylicText' : 'text-slate-500'}`}>已设置自定义背景</p>
                      <button onClick={handleBgRemove}
                        className="mt-1 text-xs text-red-500 hover:text-red-600">移除背景</button>
                    </div>
                  </div>
                ) : (
                  <p className={`text-xs ${bgImage ? 'acrylicText' : 'text-slate-500'}`}>上传图片作为应用背景</p>
                )}
                <label className="block">
                  <span className="sr-only">选择背景图片</span>
                  <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" id="bg-input" />
                  <span className={`inline-block px-4 py-2 text-xs rounded-lg cursor-pointer transition-colors ${bgImage ? 'bg-transparent border border-white/30 acrylicText hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                    {bgImage ? '更换背景' : '选择图片'}
                  </span>
                </label>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4">
              <h3 className={`text-sm font-medium mb-3 ${bgImage ? 'acrylicText' : 'text-slate-700'}`}>📱 桌面小部件设置</h3>
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs mb-2 ${bgImage ? 'acrylicText' : 'text-slate-500'}`}>字体大小</label>
                  <div className="flex gap-1">
                    {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => (
                      <button key={size} onClick={() => {
                        setWidgetFontSize(size);
                        saveWidgetSettings({ fontSize: size });
                      }}
                        className={`flex-1 py-2 px-1 text-xs rounded-lg transition-colors ${
                          widgetFontSize === size
                            ? (bgImage ? 'bg-transparent border border-blue-400/50 acrylicText' : 'bg-blue-500 text-white')
                            : (bgImage ? 'acrylicText hover:text-slate-700' : 'bg-slate-100 hover:bg-blue-100 text-slate-600')
                        }`}>
                        {size === 'xs' ? '极小' : size === 'sm' ? '小' : size === 'md' ? '中' : size === 'lg' ? '大' : '极大'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-2 ${bgImage ? 'acrylicText' : 'text-slate-500'}`}>背景透明度: {widgetOpacity}%</label>
                  <div className="flex gap-1 items-center">
                    <span className={`text-xs ${bgImage ? 'acrylicText' : 'text-slate-400'}`}>暗</span>
                    <input type="range" min="0" max="100" value={widgetOpacity} onChange={e => {
                      const val = parseInt(e.target.value);
                      setWidgetOpacity(val);
                      saveWidgetSettings({ opacity: val.toString() });
                    }} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    <span className={`text-xs ${bgImage ? 'acrylicText' : 'text-slate-400'}`}>亮</span>
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-2 ${bgImage ? 'acrylicText' : 'text-slate-500'}`}>小部件主题</label>
                  <div className="flex gap-2">
                    <button onClick={() => saveWidgetSettings({ theme: 'light' })}
                      className={`flex-1 py-2 px-3 text-xs rounded-lg transition-colors ${bgImage ? 'bg-transparent border border-white/30 acrylicText hover:bg-white/10' : 'bg-slate-100 hover:bg-blue-100 text-slate-600'}`}>
                      ☀️ 浅色
                    </button>
                    <button onClick={() => saveWidgetSettings({ theme: 'dark' })}
                      className={`flex-1 py-2 px-3 text-xs rounded-lg transition-colors ${bgImage ? 'bg-transparent border border-white/30 acrylicText hover:bg-white/10' : 'bg-slate-100 hover:bg-blue-100 text-slate-600'}`}>
                      🌙 深色
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => { snoozeSemesterPrompt(); setShowSemesterModal(false); }}
                className={`flex-1 py-3 rounded-xl text-sm font-medium ${bgImage ? 'bg-transparent border border-white/30 acrylicText' : 'bg-slate-100 text-slate-600'}`}>一个月内不提醒</button>
              <button onClick={() => { setSemesterStart(semesterDate, semesterName); setShowSemesterModal(false); }}
                className={`flex-1 py-3 rounded-xl text-sm font-medium ${bgImage ? 'bg-transparent border border-blue-400/50 acrylicText' : 'bg-blue-500 text-white'}`}>保存</button>
            </div>
            <button onClick={() => { setShowSemesterModal(false); reset(); }}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${bgImage ? 'bg-transparent border border-red-400/50 text-red-500 hover:bg-red-500/10' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
              重新导入新课表
            </button>
            
            <div className="pt-4 border-t border-slate-100">
              <button 
                onClick={() => {
                  if (versionClicks >= 4) {
                    setDeveloperMode(true);
                    setVersionClicks(0);
                    setTimeout(() => {
                      alert('🎉 恭喜你进入开发者模式\n\nYMHTBYING祝你拥有美好的一天！');
                    }, 50);
                  } else {
                    setVersionClicks(versionClicks + 1);
                  }
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors">
                课表应用 v1.0
              </button>
              {versionClicks > 0 && versionClicks < 5 && (
                <p className="text-center text-xs text-slate-400 mt-1">再点 {5 - versionClicks} 次有惊喜</p>
              )}
              {developerMode && (
                <p className="text-center text-xs text-green-500 mt-1 font-medium">🔓 开发者模式已开启</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
