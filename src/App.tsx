import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ChevronRight, 
  ChevronLeft,
  Calendar,
  Loader2, 
  Search, 
  History,
  LayoutDashboard,
  Database,
  Plus,
  RefreshCw,
  Eye,
  ShieldCheck,
  FileSearch,
  ExternalLink,
  Info,
  Trash2,
  RotateCcw,
  Check,
  FileCode,
  FileSpreadsheet,
  BrainCircuit,
  ChevronDown,
  X,
  Key,
  Settings2,
  Save,
  GripVertical
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { extractTextFromPdf, analyzeBrokerStatement, analyzeBrokerStatementWithTemplate } from './services/aiService';

// --- Constants & Business Logic ---

const MAPPINGS = {
  'A8842910': 'Account_Alpha_Gold',
  'B1000234': 'Acc_A_Trust',
  'C2000556': 'Acc_B_Private',
  'JPM77212': 'JPM_Custody_3',
  'GEF10203': 'JPM_Strat_Equity',
  'EBF44210': 'GS_Fixed_Income',
  'PRA77100': 'Citi_PacRim_Alpha',
  'UGP00455': 'MS_Gilt_Plus',
  'EMD11299': 'BNP_Emerging_Mkt',
  'SRE88288': 'UBS_Swiss_Real_Estate',
  'UTG66511': 'Barc_US_Tech',
  'GMF44300': 'DB_Global_Macro',
  'AA091000': 'SG_Alt_Alpha',
  'RET22188': 'SST_RE_Trust'
};

const TRANSACTION_TYPES = {
  DIVIDEND: 'Dividend',
  CAPITAL_MOVEMENT: 'Capital Movement',
  INTEREST: 'Interest',
  FEE: 'Service Fee'
};

const INITIAL_MAILBOX = [];

// --- Mock Database for Test Scenarios ---

const MOCK_HISTORICAL_DATA = {
  '2026-04-06': [
    { id: 'h1', sender: 'State Street', subject: 'Portfolio Report', timestamp: '09:00', status: 'processed', fileName: 'ST_STREET_0924.pdf' },
    { id: 'h2', sender: 'J.P. Morgan', subject: 'Daily Activity', timestamp: '09:15', status: 'processed', fileName: 'JPM_DAILY_2024.pdf' }
  ],
  '2026-04-07': [
    { id: 'h3', sender: 'Barclays', subject: 'PB Statement', timestamp: '08:45', status: 'processed', fileName: 'BARC_PB_665.pdf' }
  ],
  '2026-04-10': [
    { id: 'h4', sender: 'Goldman Sachs', subject: 'Dividend Advice', timestamp: '10:30', status: 'processed', fileName: 'GS_DIV_REPORT.pdf' },
    { id: 'h5', sender: 'UBS AG', subject: 'Margin Call', timestamp: '11:00', status: 'processed', fileName: 'UBS_WM_882.pdf' }
  ],
  '2026-04-15': [
    { id: 'h6', sender: 'Citibank', subject: 'Custody Statement', timestamp: '14:20', status: 'processed', fileName: 'CITI_CUST_771.pdf' }
  ],
  '2026-04-20': [
    { id: 'h7_1', sender: 'Deutsche Bank', subject: 'Global Recap', timestamp: '09:50', status: 'processed', fileName: 'DB_GM_443.pdf' },
    { id: 'h7_2', sender: 'J.P. Morgan', subject: 'Cash Report', timestamp: '10:15', status: 'processed', fileName: 'JPM_DAILY_2024.pdf' },
    { id: 'h7_3', sender: 'UBS AG', subject: 'Portfolio Valuation', timestamp: '11:00', status: 'processed', fileName: 'UBS_WM_882.pdf' }
  ],
  '2026-04-21': [
    { id: 'h8_1', sender: 'Barclays', subject: 'Daily Recon', timestamp: '08:30', status: 'processed', fileName: 'BARC_PB_665.pdf' },
    { id: 'h8_2', sender: 'Citibank', subject: 'Asset List', timestamp: '09:00', status: 'processed', fileName: 'CITI_CUST_771.pdf' }
  ],
  '2026-04-22': [
    { id: 'h9_1', sender: 'Goldman Sachs', subject: 'Trade Confirms', timestamp: '10:00', status: 'processed', fileName: 'GS_DIV_REPORT.pdf' },
    { id: 'h9_2', sender: 'State Street', subject: 'Custody Report', timestamp: '11:45', status: 'processed', fileName: 'ST_STREET_0924.pdf' },
    { id: 'h9_3', sender: 'Deutsche Bank', subject: 'Flow Summary', timestamp: '12:00', status: 'processed', fileName: 'DB_GM_443.pdf' }
  ],
  '2026-04-23': [
    { id: 'h10_1', sender: 'UBS AG', subject: 'Margin Statement', timestamp: '09:20', status: 'processed', fileName: 'UBS_WM_882.pdf' },
    { id: 'h10_2', sender: 'J.P. Morgan', subject: 'Equities Recap', timestamp: '10:05', status: 'processed', fileName: 'JPM_DAILY_2024.pdf' }
  ],
  '2026-04-24': [
    { id: 'h11_1', sender: 'Barclays', subject: 'Weekly Review', timestamp: '15:00', status: 'processed', fileName: 'BARC_PB_665.pdf' },
    { id: 'h11_2', sender: 'Deutsche Bank', subject: 'Weekend Prep', timestamp: '16:30', status: 'processed', fileName: 'DB_GM_443.pdf' },
    { id: 'h11_3', sender: 'Citibank', subject: 'Global Settlement', timestamp: '17:00', status: 'processed', fileName: 'CITI_CUST_771.pdf' }
  ],
  '2026-04-27': [
    { id: 'h12_1', sender: 'State Street', subject: 'Monday Opening', timestamp: '07:30', status: 'processed', fileName: 'ST_STREET_0924.pdf' },
    { id: 'h12_2', sender: 'Goldman Sachs', subject: 'Risk Assessment', timestamp: '08:45', status: 'processed', fileName: 'GS_DIV_REPORT.pdf' }
  ],
  '2026-04-28': [
    { id: 'h13_1', sender: 'J.P. Morgan', subject: 'Activity Detail', timestamp: '09:10', status: 'processed', fileName: 'JPM_DAILY_2024.pdf' },
    { id: 'h13_2', sender: 'UBS AG', subject: 'Wealth Audit', timestamp: '10:50', status: 'processed', fileName: 'UBS_WM_882.pdf' }
  ],
  '2026-04-29': [
    { id: 'h14_1', sender: 'Barclays', subject: 'PB Monthly Draft', timestamp: '11:20', status: 'processed', fileName: 'BARC_PB_665.pdf' },
    { id: 'h14_2', sender: 'Deutsche Bank', subject: 'FX Exposure', timestamp: '12:15', status: 'processed', fileName: 'DB_GM_443.pdf' }
  ],
  '2026-04-30': [
    { id: 'h15_1', sender: 'Citibank', subject: 'Tax Advice', timestamp: '13:40', status: 'processed', fileName: 'CITI_CUST_771.pdf' },
    { id: 'h15_2', sender: 'Goldman Sachs', subject: 'Portfolio Hedge', timestamp: '14:20', status: 'processed', fileName: 'GS_DIV_REPORT.pdf' },
    { id: 'h15_3', sender: 'State Street', subject: 'Asset Summary', timestamp: '15:10', status: 'processed', fileName: 'ST_STREET_0924.pdf' }
  ],
  '2026-05-01': [
    { id: 'h16_1', sender: 'UBS AG', subject: 'May 1st Statement', timestamp: '09:00', status: 'processed', fileName: 'UBS_WM_882.pdf' },
    { id: 'h16_2', sender: 'J.P. Morgan', subject: 'Holiday Recap', timestamp: '10:00', status: 'processed', fileName: 'JPM_DAILY_2024.pdf' }
  ]
};

const MOCK_DATABASE = {
  'GPB_STMT_FND884.pdf': {
    fundId: 'A8842910',
    account: 'Account_Alpha_Gold',
    currency: 'PLN',
    cashOpening: 3200500.00,
    cashClosing: 3213650.00,
    equitiesOpening: 12450000.00,
    equitiesClosing: 12267500.00,
    marginOpening: 2100000.00,
    marginClosing: 2050000.00,
    freeMarginOpening: 13550500.00,
    freeMarginClosing: 13431150.00,
    confidenceScore: 0.99,
    isLowDpi: false,
    transactions: [
      { date: '10.04.2026', type: 'Uznanie', description: 'Dywidenda SAP SE', amount: 5200.00, currency: 'EUR', evidenceSnippet: 'SAP SE' },
      { date: '12.04.2026', type: 'Uznanie', description: 'Sprzedaż Apple Inc.', amount: 8400.00, currency: 'USD', evidenceSnippet: 'Apple Inc' },
      { date: '28.04.2026', type: 'Prowizja', description: 'Opłaty administracyjne', amount: -450.00, currency: 'USD', evidenceSnippet: 'administracyjne' },
    ],
    evidence: {
      fundId: 'A8842910',
      cashOpening: '3200500.00',
      cashClosing: '3213650.00'
    },
    rawText: "BROKER: Global Prime Brokerage\nFUND ID: A8842910\nACCOUNT: Account_Alpha_Gold\nOPENING BALANCE: 3,200,500.00 PLN\nCLOSING BALANCE: 3,213,650.00 PLN"
  },
  'ST_STREET_0924.pdf': {
    fundId: 'B1000234',
    account: 'Acc_A_Trust',
    currency: 'USD',
    cashOpening: 1250000.00,
    cashClosing: 1285400.50,
    equitiesOpening: 4500000.00,
    equitiesClosing: 4600000.00,
    marginOpening: 500000.00,
    marginClosing: 520000.00,
    freeMarginOpening: 5250000.00,
    freeMarginClosing: 5365400.50,
    confidenceScore: 0.94,
    isLowDpi: false,
    transactions: [
      { date: '01.09.2024', type: 'Uznanie', description: 'INTEREST PAYMENT - T-BILL 3M', amount: 3400.50, currency: 'USD', evidenceSnippet: 'INTEREST' },
      { date: '05.09.2024', type: 'Uznanie', description: 'CASH COLLATERAL TOP-UP', amount: 32000.00, currency: 'USD', evidenceSnippet: 'COLLATERAL' },
    ],
    evidence: {
      fundId: 'B1000234',
      cashOpening: '1250000.00',
      cashClosing: '1285400.50'
    },
    rawText: "BROKER: State Street Global\nFUND ID: B1000234\nACCOUNT: Acc_A_Trust\nOPENING BALANCE: 1,250,000.00 USD\nCLOSING BALANCE: 1,285,400.50 USD"
  },
  'JPM_DAILY_2024.pdf': {
    fundId: 'JPM77212',
    account: 'JPM_Custody_3',
    currency: 'EUR',
    cashOpening: 890400.00,
    cashClosing: 885200.00,
    equitiesOpening: 2100000.00,
    equitiesClosing: 2050000.00,
    marginOpening: 400000.00,
    marginClosing: 395000.00,
    freeMarginOpening: 2590400.00,
    freeMarginClosing: 2540200.00,
    confidenceScore: 0.82,
    isLowDpi: true,
    transactions: [
      { date: '02.05.2024', type: 'Prowizja', description: 'CUSTODY SERVICE FEE - Q1', amount: -5200.00, currency: 'EUR', evidenceSnippet: 'SERVICE FEE' },
    ],
    evidence: {
      fundId: 'JPM77212',
      cashOpening: '890400.00',
      cashClosing: '885200.00'
    },
    rawText: "BROKER: JP Morgan Chase\nFUND ID: JPM77212\nACCOUNT: JPM_Custody_3\nOPENING BALANCE: 890,400.00 EUR\nCLOSING BALANCE: 885,200.00 EUR"
  },
  'GS_DIV_REPORT.pdf': {
    fundId: 'C2000556',
    account: 'Acc_B_Private',
    currency: 'GBP',
    cashOpening: 150000.00,
    cashClosing: 154200.00,
    equitiesOpening: 900000.00,
    equitiesClosing: 910000.00,
    marginOpening: 100000.00,
    marginClosing: 102000.00,
    freeMarginOpening: 950000.00,
    freeMarginClosing: 962200.00,
    confidenceScore: 0.99,
    isLowDpi: false,
    transactions: [
      { date: '05.05.2024', type: 'Uznanie', description: 'DIVIDEND - RIO TINTO PLC', amount: 4200.00, currency: 'GBP', evidenceSnippet: 'RIO TINTO' },
    ],
    evidence: {
      fundId: 'C2000556',
      cashOpening: '150000.00',
      cashClosing: '154200.00'
    },
    rawText: "BROKER: Goldman Sachs\nFUND ID: C2000556\nACCOUNT: Acc_B_Private\nOPENING BALANCE: 150,000.00 GBP\nCLOSING BALANCE: 154,200.00 GBP"
  }
};

const DEFAULT_MOCK = {
  fundId: 'GEN77255',
  account: 'Account_Default_Custody',
  currency: 'USD',
  cashOpening: 1540200.00,
  cashClosing: 1538550.20,
  equitiesOpening: 8500000.00,
  equitiesClosing: 8650000.00,
  marginOpening: 450000.00,
  marginClosing: 440000.00,
  freeMarginOpening: 9590200.00,
  freeMarginClosing: 9748550.20,
  confidenceScore: 0.92,
  isLowDpi: false,
  transactions: [
    { date: '12.04.2024', type: 'Uznanie', description: 'INT-CASH BALANCE CREDIT', amount: 450.20, currency: 'USD', evidenceSnippet: 'INT-CASH' },
    { date: '14.04.2024', type: 'Prowizja', description: 'MANAGEMENT FEE SETTLEMENT', amount: -2100.00, currency: 'USD', evidenceSnippet: 'MANAGEMENT' }
  ],
  evidence: {
    fundId: 'GEN77255',
    cashOpening: '1540200.00',
    cashClosing: '1538550.20'
  },
  rawText: "BROKER: GENERIC BROKER\nFUND ID: GEN77255\nACCOUNT: Account_Default_Custody\nOPENING BALANCE: 1,540,200.00 USD\nCLOSING BALANCE: 1,538,550.20 USD"
};

export default function App() {
  const [mailbox, setMailbox] = useState(INITIAL_MAILBOX);
  
  // Dynamic "Today" setup
  const getToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date(getToday().getFullYear(), getToday().getMonth(), 1));

  const minDate = new Date('2026-04-01');
  minDate.setHours(0, 0, 0, 0);
  const today = getToday();

  // Helper to check if two dates are the same day
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    newDate.setHours(0, 0, 0, 0);

    if (newDate >= minDate && newDate <= today) {
      setSelectedDate(newDate);
      setAnalysisResult(null);
      setSelectedFile(null);
      setTemplateAnalysisResult(null);
      
      const dateKey = newDate.toISOString().split('T')[0];
      if (MOCK_HISTORICAL_DATA[dateKey]) {
        setMailbox(MOCK_HISTORICAL_DATA[dateKey]);
      } else if (isSameDay(newDate, today)) {
        setMailbox(INITIAL_MAILBOX);
      } else {
        setMailbox([]);
      }
      
      setUploadedFiles([]);
      addNotification(`Widok dla dnia: ${formatDate(newDate)}`, "info");
    }
  };

  const selectSpecificDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    if (d >= minDate && d <= today) {
      setSelectedDate(d);
      setAnalysisResult(null);
      setSelectedFile(null);
      setTemplateAnalysisResult(null);
      setIsCalendarOpen(false);
      
      const dateKey = d.toISOString().split('T')[0];
      if (MOCK_HISTORICAL_DATA[dateKey]) {
        setMailbox(MOCK_HISTORICAL_DATA[dateKey]);
      } else if (isSameDay(d, today)) {
        setMailbox(INITIAL_MAILBOX);
      } else {
        setMailbox([]);
      }
      
      setUploadedFiles([]);
      addNotification(`Widok dla dnia: ${formatDate(d)}`, "info");
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust to Monday start
  };
  const [expandedSection, setExpandedSection] = useState('mailbox');
  const [mailboxTab, setMailboxTab] = useState('new'); // 'new' or 'done'
  const [activeView, setActiveView] = useState('makers'); // 'makers' or 'rules'
  const [rulesSubView, setRulesSubView] = useState('fund'); // 'fund' or 'output'
  const [fundMappings, setFundMappings] = useState(MAPPINGS);
  const [outputTemplates, setOutputTemplates] = useState([
    { 
      id: 'tpl_1', 
      name: 'Standard Reconciliation', 
      columns: [
        { id: 'c1', name: 'Fund ID' },
        { id: 'c2', name: 'Account' },
        { id: 'c3', name: 'Currency' },
        { id: 'c4', name: 'Cash Closing' },
        { id: 'c5', name: 'Activity Sum' }
      ],
      customPrompt: 'Analizuj dokument pod kątem głównych sald gotówkowych. Skup się na wartościach "Opening Balance" oraz "Closing Balance" w sekcji Cash Summary.'
    },
    { 
      id: 'tpl_2', 
      name: 'Audit View', 
      columns: [
        { id: 'c6', name: 'Date' },
        { id: 'c7', name: 'Broker' },
        { id: 'c8', name: 'Cash Opening' },
        { id: 'c9', name: 'Cash Closing' },
        { id: 'c10', name: 'Diff' }
      ],
      customPrompt: 'Wymagana pełna weryfikacja wszystkich transakcji. Wyodrębnij nazwy brokerów z nagłówka i sprawdź czy suma transakcji zgadza się z różnicą sald.'
    }
  ]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('tpl_1');
  const [mappingSearch, setMappingSearch] = useState('');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [expandedFundId, setExpandedFundId] = useState<string | null>(null);
  const [uploadedTab, setUploadedTab] = useState('new'); // 'new' or 'done'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefreshingMailbox, setIsRefreshingMailbox] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({
    firstName: 'Jerzy',
    lastName: 'Świerk',
    position: 'Senior Fund Accountant'
  });
  const [loginForm, setLoginForm] = useState({
    firstName: '',
    lastName: '',
    position: '',
    password: ''
  });
  const [customApiKey, setCustomApiKey] = useState(localStorage.getItem('custom_gemini_api_key') || '');
  const [outlookConfig, setOutlookConfig] = useState({
    email: '',
    password: '',
    isConnected: false
  });
  const [outlookForm, setOutlookForm] = useState({
    email: '',
    password: ''
  });
  const [templateAnalysisResult, setTemplateAnalysisResult] = useState<any>(null);
  const [isTemplateAnalyzing, setIsTemplateAnalyzing] = useState(false);
  const [expandedResults, setExpandedResults] = useState(['standard']);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [highlightedField, setHighlightedField] = useState(null);

  const fileInputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const elementRefs = useRef({});

  const scrollToElement = (id) => {
    const el = elementRefs.current[id];
    if (el && scrollContainerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    if (highlightedField) {
      scrollToElement(highlightedField);
    }
  }, [highlightedField]);

  const startTemplateAnalysis = async (rawText: string) => {
    if (!rawText || !selectedTemplateId) return;
    
    setIsTemplateAnalyzing(true);
    setTemplateAnalysisResult(null);
    
    try {
      const template = outputTemplates.find(t => t.id === selectedTemplateId);
      if (!template) return;
      
      const fields = template.columns.map(c => c.name);
      if (fields.length === 0) {
        setTemplateAnalysisResult({});
        setIsTemplateAnalyzing(false);
        return;
      }

      // Add context about fund mappings to allow AI to perform "połącz z Fund Mapping"
      const mappingContext = `
        LOCAL FUND MAPPINGS (Database):
        ${Object.entries(fundMappings).map(([id, account]) => `- ID: ${id} -> Account/Client: ${account}`).join('\n')}
        
        Use these mappings if the instructions ask to connect or join fund data with system records.
      `;

      const result = await analyzeBrokerStatementWithTemplate(rawText, template.customPrompt, fields, mappingContext);
      setTemplateAnalysisResult(result);
      addNotification("Analiza szablonowa zakończona", "success");
    } catch (error) {
      console.error(error);
      addNotification("Błąd analizy szablonowej", "error");
    } finally {
      setIsTemplateAnalyzing(false);
    }
  };

  useEffect(() => {
    if (analysisResult?.rawText && selectedTemplateId) {
      startTemplateAnalysis(analysisResult.rawText);
    }
  }, [analysisResult?.rawText, selectedTemplateId]);

  const handleManualUpload = (file) => {
    setUploadedFiles(prev => {
      if (prev.find(f => f.name === file.name)) return prev;
      return [{ 
        id: Date.now(), 
        name: file.name, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'pending',
        rawFile: file // Store the real file object
      }, ...prev];
    });
    setExpandedSection('uploaded');
    addNotification("Plik dodany do kolejki", "info");
  };

  const removeUploadedFile = (id, e) => {
    e.stopPropagation();
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    addNotification("Plik został usunięty", "info");
    if (selectedFile?.id === id) {
      setSelectedFile(null);
      setAnalysisResult(null);
    }
  };

  const markFileAsDone = () => {
    if (!selectedFile) return;

    if (selectedFile.source === 'mailbox') {
      setMailbox(prev => prev.map(m => 
        (m.id === selectedFile.originalId || m.fileName === selectedFile.name) 
        ? { ...m, status: 'processed' } 
        : m
      ));
    } else {
      setUploadedFiles(prev => prev.map(f => 
        f.id === selectedFile.originalId 
        ? { ...f, status: 'processed' } 
        : f
      ));
    }
    setSelectedFile(null);
    setAnalysisResult(null);
    addNotification("Plik został oznaczony jako zrobiony", "success");
  };

  const handleRefreshMailbox = () => {
    if (isRefreshingMailbox) return;
    setIsRefreshingMailbox(true);
    addNotification("Łączenie z serwerem pocztowym...", "info");
    
    // Pool of realistic simulated statements
    const MOCK_POOL = [
      { sender: 'J.P. Morgan', subject: 'Portfolio Strategy Report', fileName: 'JPM_STRAT_992.pdf', fund: 'GEF10203', cur: 'USD', cash: [1250440.50, 1310200.00], eq: 8440200.00 },
      { sender: 'Goldman Sachs', subject: 'Daily Transaction Advice', fileName: 'GS_ADV_4421.pdf', fund: 'EBF44210', cur: 'EUR', cash: [450200.00, 448100.20], eq: 12500000.00 },
      { sender: 'Citibank', subject: 'Asset Custody Statement', fileName: 'CITI_CUST_771.pdf', fund: 'PRA77100', cur: 'HKD', cash: [8804200, 8950000], eq: 45200000.00 },
      { sender: 'Morgan Stanley', subject: 'Equity Derivatives Report', fileName: 'MS_DERIV_004.pdf', fund: 'UGP00455', cur: 'GBP', cash: [120440.15, 115000.00], eq: 3400000.00 },
      { sender: 'BNP Paribas', subject: 'Fixed Income Valuation', fileName: 'BNP_FI_112.pdf', fund: 'EMD11299', cur: 'EUR', cash: [2250100.00, 2265400.50], eq: 18900400.00 },
      { sender: 'UBS AG', subject: 'Wealth Management Summary', fileName: 'UBS_WM_882.pdf', fund: 'SRE88288', cur: 'CHF', cash: [550400.00, 545200.00], eq: 9200100.00 },
      { sender: 'Barclays', subject: 'Prime Brokerage Daily', fileName: 'BARC_PB_665.pdf', fund: 'UTG66511', cur: 'USD', cash: [980100.50, 1025400.00], eq: 22400500.00 },
      { sender: 'Deutsche Bank', subject: 'Global Markets Recap', fileName: 'DB_GM_443.pdf', fund: 'GMF44300', cur: 'EUR', cash: [740200.10, 735200.00], eq: 15400200.00 },
      { sender: 'Societe Generale', subject: 'Cross Asset Analysis', fileName: 'SG_CROSS_091.pdf', fund: 'AA091000', cur: 'EUR', cash: [330440.50, 315000.20], eq: 6700400.00 },
      { sender: 'State Street', subject: 'Fund Administration View', fileName: 'SST_ADMIN_221.pdf', fund: 'RET22188', cur: 'USD', cash: [4450200, 4425100], eq: 88500200.00 }
    ];

    // Simulate network delay
    setTimeout(() => {
      // Pick 3 random distinct ones from pool
      const shuffled = [...MOCK_POOL].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);

      const newMails = selected.map(item => {
        // Generate random unique transactions for this specific file
        const txCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 transactions
        const txTypes = [
          { type: 'Uznanie', desc: 'Dividend Payment', snippet: 'Dividend' },
          { type: 'Prowizja', desc: 'Management Fee', snippet: 'Fee' },
          { type: 'Uznanie', desc: 'Interest Credit', snippet: 'Interest' },
          { type: 'Przelew', desc: 'Tax Withholding', snippet: 'Tax' },
          { type: 'Uznanie', desc: 'Security Lending', snippet: 'Lending' }
        ];

        const transactions = Array.from({ length: txCount }).map((_, i) => {
          const base = txTypes[Math.floor(Math.random() * txTypes.length)];
          const amount = base.type === 'Uznanie' 
            ? (Math.random() * 5000 + 500) 
            : -(Math.random() * 2000 + 100);
            
          return {
            date: `2024-05-0${i + 1}`,
            type: base.type,
            description: `${item.sender} - ${base.desc}`,
            amount: parseFloat(amount.toFixed(2)),
            currency: item.cur,
            evidenceSnippet: base.snippet
          };
        });

        // Calculate closing balance based on activity
        const totalActivity = transactions.reduce((acc, tx) => acc + tx.amount, 0);
        const cashClosing = parseFloat((item.cash[0] + totalActivity).toFixed(2));

        return {
          id: `mail_${Date.now()}_${Math.random()}`,
          sender: item.sender,
          subject: item.subject,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'pending',
          fileName: item.fileName,
          results: {
            fundId: item.fund,
            account: fundMappings[item.fund] || '',
            currency: item.cur,
            cashOpening: item.cash[0],
            cashClosing: cashClosing,
            equitiesOpening: item.eq,
            equitiesClosing: item.eq + (Math.random() * 20000 - 10000),
            marginOpening: 0,
            marginClosing: 0,
            freeMarginOpening: item.cash[0],
            freeMarginClosing: cashClosing,
            confidenceScore: 0.99,
            isLowDpi: false,
            rawText: `PROCESSED BY SIMULATION\nBROKER: ${item.sender}\nFUND ID: ${item.fund}\nREPORT: ${item.subject}\nOPENING: ${item.cash[0]}\nCLOSING: ${cashClosing}`,
            evidence: {
              fundId: item.fund,
              cashOpening: item.cash[0].toString(),
              cashClosing: cashClosing.toString()
            },
            transactions: transactions
          }
        };
      });

      setMailbox(prev => [...newMails, ...prev]);
      setIsRefreshingMailbox(false);
      addNotification(`Pobrano 3 nowe pliki z mailboxa`, "success");
    }, 1500);
  };

  const saveApiKey = () => {
    localStorage.setItem('custom_gemini_api_key', customApiKey);
    addNotification("Klucz API został zapisany lokalnie", "success");
    setIsSettingsOpen(false);
  };

  const undoFileStatus = (id, source, e) => {
    e.stopPropagation();
    if (source === 'mailbox') {
      setMailbox(prev => prev.map(m => m.id === id ? { ...m, status: 'pending' } : m));
    } else {
      setUploadedFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'pending' } : f));
    }
    addNotification("Przywrócono do nowych", "info");
  };

  const startAnalysis = async (file, source = 'uploaded') => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setUploadProgress(0);
    
    const fileName = file.fileName || file.name;

    setSelectedFile({ 
      name: fileName, 
      size: (file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : '0.45 MB'),
      source,
      originalId: file.id || null,
      rawFile: file.rawFile || null
    });
    
    try {
      if (file.results) {
        // Use pre-calculated simulated data for mailbox
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              // Ensure we use the latest fund mappings even for pre-populated mailbox results
              const mappedAccount = fundMappings[file.results.fundId] || '';
              setAnalysisResult({
                ...file.results,
                account: mappedAccount
              });
              setIsAnalyzing(false);
              addNotification("Dane pobrane z mailboxa", "success");
            }, 300);
          }
        }, 50);
      } else if (file.rawFile) {
        setUploadProgress(20);
        const { text, pages, positions } = await extractTextFromPdf(file.rawFile);
        setUploadProgress(50);
        const result = await analyzeBrokerStatement(text);
        setUploadProgress(100);
        
        // Clean and prioritize mapping lookup
        const cleanFundId = (result.fundId || '').trim();
        result.account = fundMappings[cleanFundId] || '';
        
        setAnalysisResult({ ...result, rawText: text, pages, positions });
        setIsAnalyzing(false);
        addNotification("Analiza AI zakończona sukcesem", "success");
      } else {
        // Fallback to mock for example mailbox files
        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          setUploadProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              simulateAI(file.name);
            }, 600);
          }
        }, 80);
      }
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
      setUploadProgress(0);
      addNotification("Błąd analizy: " + (error instanceof Error ? error.message : "Spróbuj ponownie"), "error");
    }
  };

  const handleReanalysis = async () => {
    if (!selectedFile) return;
    
    const allItems = [...mailbox, ...uploadedFiles];
    const fileToAnalyze = allItems.find(item => item.id === selectedFile.originalId);
    
    if (fileToAnalyze) {
      startAnalysis(fileToAnalyze, selectedFile.source);
    } else if (selectedFile.rawFile) {
      // For manually uploaded files that might not be in the list
      startAnalysis({ ...selectedFile, rawFile: selectedFile.rawFile }, selectedFile.source);
    } else {
      addNotification("Nie można odnaleźć pliku do ponownej analizy", "error");
    }
  };

  const simulateAI = (fileName = '') => {
    const fn = (fileName || '').toLowerCase();
    
    // Find matching mock data or use default
    const matchingKey = Object.keys(MOCK_DATABASE).find(key => fn.includes(key.toLowerCase()));
    let result = matchingKey ? { ...MOCK_DATABASE[matchingKey] } : { ...DEFAULT_MOCK, fundId: fileName.split('.')[0] };
    
    // Resolve account from dynamic mappings
    result.account = fundMappings[result.fundId] || '';

    setAnalysisResult(result);
    setIsAnalyzing(false);
    setUploadProgress(0);
    
    if (!result.account) {
      addNotification("Brak mapowania – wymagana eskalacja do Service Delivery", "error");
    } else {
      addNotification("Weryfikacja OCR zakończona sukcesem", "success");
    }
  };

  const addNotification = (message, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const handleExport = () => {
    if (!analysisResult) return;

    // Get selected template or fallback to first
    const template = outputTemplates.find(t => t.id === selectedTemplateId) || outputTemplates[0];
    const columns = template.columns;

    // Helper to map template column name to actual data value
    const getValue = (colName: string) => {
      // Prioritize results from template-specific AI analysis
      if (templateAnalysisResult && templateAnalysisResult[colName]) {
        return templateAnalysisResult[colName];
      }

      const name = colName.toLowerCase();
      if (name.includes('fund')) return analysisResult.fundId || '';
      if (name.includes('account') || name.includes('konto')) return analysisResult.account || 'MAPPING_NOT_FOUND';
      if (name.includes('currency') || name.includes('waluta')) return analysisResult.currency || '';
      if (name.includes('opening') || name.includes('otwarcia')) return analysisResult.cashOpening?.toString() || '0';
      if (name.includes('closing') || name.includes('zamknięcia')) return analysisResult.cashClosing?.toString() || '0';
      if (name.includes('activity') || name.includes('suma')) {
        const sum = (analysisResult.transactions || []).reduce((acc: number, tx: any) => acc + tx.amount, 0);
        return sum.toFixed(2);
      }
      if (name.includes('date') || name.includes('data')) return new Date().toLocaleDateString('pl-PL');
      if (name.includes('broker')) return analysisResult.rawText?.split('\n').find(l => l.includes('BROKER'))?.split(': ')[1] || 'Unknown';
      if (name.includes('diff')) return (analysisResult.cashClosing - analysisResult.cashOpening).toFixed(2);
      return '';
    };

    // Construct CSV without quotes or semicolons
    const header = columns.map(c => c.name).join(',');
    const dataRow = columns.map(col => {
      // Clean data from separators that could break columns
      return String(getValue(col.name)).replace(/[,;"]/g, '').trim();
    }).join(',');

    // Add "sep=," for Excel to force column separation by comma
    const csvContent = `sep=,\n${header}\n${dataRow}`;

    // Filename: TemplateName + AccountMapping + ddmmyyyyhhmm
    const now = new Date();
    const timestamp = now.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\./g, '') +
                      now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '');
    
    const cleanTemplateName = template.name.replace(/\s+/g, '_');
    const cleanAccount = (analysisResult.account || 'NO_MAPPING').replace(/\s+/g, '_');
    const fileName = `${cleanTemplateName}_${cleanAccount}_${timestamp}.csv`;

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Automatyczne przenoszenie do "Zrobione"
    if (selectedFile) {
      if (selectedFile.source === 'mailbox') {
        setMailbox(prev => prev.map(m => 
          (m.id === selectedFile.originalId || m.fileName === selectedFile.name) 
          ? { ...m, status: 'processed' } 
          : m
        ));
      } else {
        setUploadedFiles(prev => prev.map(f => 
          f.id === selectedFile.originalId 
          ? { ...f, status: 'processed' } 
          : f
        ));
      }
    }

    addNotification("Wynik wyeksportowany do pliku Excel CSV", "success");
  };

  return (
    <div className="flex flex-col h-screen bg-[#F1F5F9] text-[#1E293B] font-sans overflow-hidden">
      {/* Top Header - Global Prime Navy Blue */}
      <header className="h-14 bg-[#0F172A] text-white flex items-center justify-between px-6 z-30 shadow-lg shrink-0 border-b border-white/10">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-inner">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Smart Analyzer <span className="font-light opacity-40 ml-2 text-xs uppercase tracking-[0.2em]">Enterprise</span></h1>
          </div>
          <nav className="flex gap-1 h-full">
            <HeaderNav 
              label="Makers Workspace" 
              active={activeView === 'makers'} 
              onClick={() => setActiveView('makers')}
            />
            <HeaderNav 
              label="Rules & Mappings" 
              active={activeView === 'rules'} 
              onClick={() => setActiveView('rules')}
            />
          </nav>
        </div>
        <div className="flex items-center gap-6">
           <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${
             (customApiKey || process.env.GEMINI_API_KEY) 
               ? "bg-white/5 border-white/10" 
               : "bg-red-500/10 border-red-500/30"
           }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                (customApiKey || process.env.GEMINI_API_KEY) ? "bg-green-500" : "bg-red-500"
              }`}></div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                (customApiKey || process.env.GEMINI_API_KEY) ? "text-slate-300" : "text-red-400"
              }`}>
                {(customApiKey || process.env.GEMINI_API_KEY) ? "Live Connection: OK" : "Brak API AI"}
              </span>
           </div>
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
           >
             <Settings2 size={18} className="group-hover:rotate-45 transition-transform" />
             <span className="text-[10px] font-black uppercase tracking-widest">Ustawienia</span>
           </button>
           <div className="h-4 w-px bg-slate-700"></div>
           <button 
             onClick={() => {
               setLoginForm({ ...userProfile, password: '' });
               setIsUserModalOpen(true);
             }}
             className="flex items-center gap-3 hover:bg-white/5 p-1.5 rounded-lg transition-colors group"
           >
              <div className="text-right">
                <p className="text-xs font-bold leading-tight group-hover:text-blue-400 transition-colors">{userProfile.firstName} {userProfile.lastName}</p>
                <p className="text-[10px] text-slate-400 font-medium">{userProfile.position}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-[11px] font-bold shadow-md border border-white/20">
                {userProfile.firstName[0]}{userProfile.lastName[0]}
              </div>
           </button>
        </div>
      </header>

      {/* 3-Column Layout */}
      <section className="flex-1 flex overflow-hidden p-4 gap-4">
        {activeView === 'makers' ? (
          <>
            {/* Column 1: Sources & Inbox */}
        <div className="w-[340px] flex flex-col gap-4 overflow-hidden shrink-0">
          {/* Date Selector */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 shrink-0 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Calendar size={16} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Dzień Analizy</span>
                  <span className="text-xs font-bold text-slate-700">{formatDate(selectedDate)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                 <div className="flex flex-col items-end mr-2">
                    <span className="text-[8px] font-black text-green-600 uppercase">Status</span>
                    <span className="text-[9px] font-bold text-slate-400">Gotowy</span>
                 </div>
                 <button 
                  onClick={() => {
                    setIsCalendarOpen(!isCalendarOpen);
                    setCalendarViewDate(new Date(selectedDate));
                  }}
                  className={`p-2 rounded-lg transition-all ${isCalendarOpen ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-400'}`}
                >
                  <ChevronDown size={16} className={`transition-transform duration-300 ${isCalendarOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Calendar Popover */}
            {isCalendarOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 5, scale: 1 }}
                className="absolute top-full left-0 right-0 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 mt-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                    {calendarViewDate.toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1))}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button 
                      onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1))}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-[9px] font-bold text-slate-300 text-center mb-1 uppercase">
                  <span>Pn</span><span>Wt</span><span>Śr</span><span>Cz</span><span>Pt</span><span>So</span><span>Nd</span>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: getFirstDayOfMonth(calendarViewDate.getFullYear(), calendarViewDate.getMonth()) }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: getDaysInMonth(calendarViewDate.getFullYear(), calendarViewDate.getMonth()) }).map((_, i) => {
                    const d = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), i + 1);
                    const isDisabled = d < minDate || d > today;
                    const isSelected = d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
                    
                    return (
                      <button
                        key={i}
                        disabled={isDisabled}
                        onClick={() => selectSpecificDate(d)}
                        className={`aspect-square flex items-center justify-center rounded-lg text-[10px] font-bold transition-all ${
                          isDisabled ? 'text-slate-300 cursor-not-allowed' : 
                          isSelected ? 'bg-blue-600 text-white shadow-sm' : 
                          'hover:bg-blue-50 text-slate-600 hover:text-blue-600'
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <button 
                    onClick={() => selectSpecificDate(today)}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                  >
                    Dzisiaj
                  </button>
                  <span className="text-[9px] text-slate-400 font-medium italic">Max: {formatDate(today)}</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Manual Input Area */}
          <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 shrink-0 transition-opacity ${!isSameDay(selectedDate, today) ? 'opacity-60 grayscale' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Plus size={14} className="text-blue-600" /> {!isSameDay(selectedDate, today) ? 'Wgrywanie Zablokowane' : 'Prześlij Plik'}
              </h3>
            </div>
            <div 
              onClick={() => isSameDay(selectedDate, today) && fileInputRef.current.click()}
              className={`border-2 border-dashed border-slate-200 rounded-xl py-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${isSameDay(selectedDate, today) ? 'hover:border-blue-500 hover:bg-blue-50/50' : 'cursor-not-allowed bg-slate-50/50'}`}
            >
              <Upload size={24} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files[0] && handleManualUpload(e.target.files[0])} />
              {!isSameDay(selectedDate, today) && <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Dostępne tylko dla dzisiaj</p>}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            {/* Tile 1: Mailbox */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
              {!outlookConfig.isConnected ? (
                <div className="p-6 bg-red-50/50 flex flex-col items-center text-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-red-900 uppercase tracking-widest leading-none mb-1">Brak połączenia</h3>
                    <p className="text-[10px] text-red-700 font-bold leading-tight">Połącz skrzynkę Outlook w ustawieniach</p>
                  </div>
                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="mt-2 px-6 py-2 bg-white border border-red-200 rounded-xl text-[10px] font-black text-red-600 uppercase tracking-widest hover:bg-red-50 transition-colors shadow-sm"
                  >
                    Otwórz Ustawienia
                  </button>
                </div>
              ) : (
                <>
                  <div 
                    className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group/header"
                    onClick={() => setExpandedSection(expandedSection === 'mailbox' ? null : 'mailbox')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-colors ${expandedSection === 'mailbox' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                        <Mail size={16} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Mailbox</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Automatyczny Import</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSameDay(selectedDate, today)) {
                            handleRefreshMailbox();
                          } else {
                            addNotification("Odświeżanie dostępne tylko dla dzisiejszej daty", "error");
                          }
                        }}
                        disabled={isRefreshingMailbox || !isSameDay(selectedDate, today)}
                        className={`p-1.5 rounded-md hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all ${isRefreshingMailbox ? 'animate-spin text-blue-600 bg-blue-50' : ''} ${!isSameDay(selectedDate, today) ? 'opacity-20 cursor-not-allowed' : ''}`}
                        title="Odśwież"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <span className="text-[10px] font-black text-slate-300">
                        {mailbox.filter(m => m.status === 'pending').length} NOWE
                      </span>
                      <ChevronRight size={16} className={`text-slate-300 transition-transform duration-300 ${expandedSection === 'mailbox' ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedSection === 'mailbox' && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-100"
                      >
                        {/* Mini Tabs */}
                        <div className="flex bg-slate-50 border-b border-slate-100">
                          <button 
                            onClick={() => setMailboxTab('new')}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${mailboxTab === 'new' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            Nowe ({mailbox.filter(m => m.status === 'pending').length})
                          </button>
                          <button 
                            onClick={() => setMailboxTab('done')}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${mailboxTab === 'done' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            Zrobione ({mailbox.filter(m => m.status === 'processed').length})
                          </button>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50">
                          {mailbox.filter(m => mailboxTab === 'new' ? m.status === 'pending' : m.status === 'processed').length > 0 ? (
                            mailbox.filter(m => mailboxTab === 'new' ? m.status === 'pending' : m.status === 'processed').map(mail => (
                              <div 
                                key={mail.id} 
                                className="px-5 py-4 hover:bg-blue-50/30 transition-all cursor-pointer group"
                                onClick={() => startAnalysis(mail, 'mailbox')}
                              >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[11px] font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate pr-2">{mail.sender}</span>
                                <span className="text-[9px] text-slate-400 font-bold">{mail.timestamp}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                  <FileText size={10} />
                                  <span className="text-[9px] truncate max-w-[140px]">{mail.fileName}</span>
                                </div>
                                {mail.status === 'processed' ? (
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={(e) => undoFileStatus(mail.id, 'mailbox', e)}
                                      className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-blue-600 transition-colors"
                                      title="Cofnij do nowych"
                                    >
                                      <RotateCcw size={12} />
                                    </button>
                                    <CheckCircle2 size={12} className="text-green-500" />
                                  </div>
                                ) : (
                                  <ChevronRight size={12} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </div>
                            </div>
                          ))
                          ) : (
                            <div className="p-8 text-center bg-slate-50/10">
                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">Brak plików w tej sekcji</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Tile 2: Przesłane Pliki */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
              <button 
                onClick={() => setExpandedSection(expandedSection === 'uploaded' ? null : 'uploaded')}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${expandedSection === 'uploaded' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                    <History size={16} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Przesłane Pliki</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Wgrywane Ręcznie</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black text-slate-300">{uploadedFiles.length} PLIKÓW</span>
                   <ChevronRight size={16} className={`text-slate-300 transition-transform duration-300 ${expandedSection === 'uploaded' ? 'rotate-90' : ''}`} />
                </div>
              </button>
              
              <AnimatePresence>
                {expandedSection === 'uploaded' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-slate-100"
                  >
                    {/* Mini Tabs */}
                    <div className="flex bg-slate-50 border-b border-slate-100">
                      <button 
                        onClick={() => setUploadedTab('new')}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${uploadedTab === 'new' ? 'text-indigo-600 bg-white border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Nowe ({uploadedFiles.filter(f => f.status === 'pending').length})
                      </button>
                      <button 
                        onClick={() => setUploadedTab('done')}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${uploadedTab === 'done' ? 'text-indigo-600 bg-white border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Zrobione ({uploadedFiles.filter(f => f.status === 'processed').length})
                      </button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50">
                      {uploadedFiles.filter(f => uploadedTab === 'new' ? f.status === 'pending' : f.status === 'processed').length > 0 ? (
                        uploadedFiles.filter(f => uploadedTab === 'new' ? f.status === 'pending' : f.status === 'processed').map(file => (
                          <div 
                            key={file.id} 
                            className="px-5 py-4 hover:bg-indigo-50/30 transition-all cursor-pointer group flex items-center justify-between"
                            onClick={() => startAnalysis(file, 'uploaded')}
                          >
                            <div className="flex-1 overflow-hidden">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[11px] font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate pr-2">{file.name}</span>
                                <span className="text-[9px] text-slate-400 font-bold">{file.timestamp}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                  <FileSearch size={10} />
                                  <span className="text-[9px]">
                                    {file.status === 'processed' ? 'Zakończono i wyeksportowano' : 'Analiza gotowa'}
                                  </span>
                                </div>
                                {file.status === 'processed' && <CheckCircle2 size={12} className="text-green-500" />}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                               {file.status === 'processed' && (
                                 <button 
                                   onClick={(e) => undoFileStatus(file.id, 'uploaded', e)}
                                   className="p-1.5 hover:bg-white rounded-md text-slate-400 hover:text-indigo-600 transition-colors"
                                   title="Cofnij do nowych"
                                 >
                                   <RotateCcw size={12} />
                                 </button>
                               )}
                               <button
                                 onClick={(e) => removeUploadedFile(file.id, e)}
                                 className="ml-2 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5"
                                 title="usuń"
                               >
                                 <Trash2 size={14} />
                                 <span className="text-[9px] font-black uppercase tracking-wider hidden group-hover:block">usuń</span>
                               </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center bg-slate-50/10">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">Brak plików w tej sekcji</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Column 2: Document Verification Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative min-w-[500px]">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <Eye size={16} className="text-blue-600" /> Weryfikacja Dokumentu
              </h3>
              {analysisResult && (
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">FAKS QUALITY:</span>
                      <span className={`text-[10px] font-black ${analysisResult.isLowDpi ? 'text-amber-600' : 'text-green-600'}`}>
                        {analysisResult.isLowDpi ? 'LOW-DPI' : 'HIGH-RES'}
                      </span>
                   </div>
                </div>
              )}
            </div>
            {analysisResult && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                <span className="text-[10px] font-bold text-slate-400">OCR CONFIDENCE:</span>
                <span className="text-xs font-black text-blue-600">{Math.round(analysisResult.confidenceScore * 100)}%</span>
              </div>
            )}
          </div>

          <div ref={scrollContainerRef} className="flex-1 bg-[#F8FAFC] p-8 overflow-y-auto relative scroll-smooth bg-dot-grid">
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div 
                  key="loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center p-12"
                >
                  <div className="relative mb-8">
                    <Loader2 size={64} className="text-blue-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-black text-blue-600 tracking-tighter">{uploadProgress}%</span>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">Trwa ekstrakcja danych AI...</h4>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm text-center font-medium">Model IDP identyfikuje tabele i mapuje waluty subkont.</p>
                  <div className="mt-10 w-full max-w-xs h-1.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </motion.div>
              ) : selectedFile ? (
                <motion.div 
                  key="stmt-view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-3xl mx-auto space-y-6"
                >
                  {/* Raw Content Collapsible */}
                  {analysisResult?.rawText && (
                    <div className="bg-slate-900 rounded-xl p-4 shadow-xl border border-white/10 mb-6">
                      <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer list-none">
                          <FileCode size={14} className="text-blue-400" />
                          <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex-1">Widok surowych danych (OCR)</h4>
                          <ChevronDown size={14} className="text-slate-400 group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="mt-4 max-h-[150px] overflow-y-auto text-[10px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-blue-500/30 p-2 bg-black/20 rounded">
                          {analysisResult.rawText}
                        </div>
                      </details>
                    </div>
                  )}

                  {/* PDF Page Rendering - REAL DOCUMENT VIEW */}
                  {analysisResult?.pages && analysisResult.pages.length > 0 ? (
                    <div className="space-y-8">
                      {analysisResult.pages.map((pageData, idx) => {
                        const pageNum = idx + 1;
                        const highlights = (() => {
                          if (!highlightedField || !analysisResult?.positions) return [];
                          
                          let snippet = '';
                          if (highlightedField.startsWith('tx-')) {
                            const txIdx = parseInt(highlightedField.split('-')[1]);
                            snippet = analysisResult.transactions?.[txIdx]?.evidenceSnippet || '';
                          } else {
                            snippet = analysisResult.evidence?.[highlightedField]?.toString() || '';
                          }
                          
                          if (!snippet) return [];
                          const lowerSnippet = snippet.toLowerCase().trim();
                          
                          return (analysisResult.positions || []).filter(p => {
                            if (p.page !== pageNum) return false;
                            const pText = (p.text || '').toLowerCase().trim();
                            return pText.length > 2 && (lowerSnippet.includes(pText) || pText.includes(lowerSnippet));
                          });
                        })();

                        return (
                          <div key={idx} className="relative group">
                            <div className="absolute -left-12 top-0 h-full flex flex-col items-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] transform -rotate-90 origin-right mt-16 whitespace-nowrap">STRONA {pageNum}</span>
                            </div>
                            <div className="bg-white shadow-2xl rounded-sm border border-slate-200 overflow-hidden ring-1 ring-slate-900/5 relative">
                              <img 
                                src={pageData} 
                                alt={`PDF Page ${pageNum}`} 
                                className="w-full h-auto"
                                referrerPolicy="no-referrer"
                              />
                              
                              {/* Automatic highlights for uploaded PDF */}
                              {highlights.map((rect, rIdx) => (
                                <div 
                                  key={rIdx}
                                  className="absolute bg-yellow-400/30 border border-yellow-500/50 mix-blend-multiply animate-pulse pointer-events-none"
                                  style={{
                                    left: `${rect.x}%`,
                                    top: `${rect.y}%`,
                                    width: `${rect.w}%`,
                                    height: `${rect.h}%`
                                  }}
                                />
                              ))}

                              {/* Interaction overlay if field is selected */}
                              {highlightedField && highlights.length > 0 && (
                                <div className="absolute inset-0 bg-yellow-400/5 pointer-events-none border-4 border-yellow-400/10" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* High Fidelity Statement Mockup / Analysis View - Fallback for internal mocks */
                    <div className="bg-white shadow-2xl rounded-sm border border-slate-200 min-h-[1000px] p-12 relative font-sans text-slate-900 select-text overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-16 border-b border-slate-200 pb-8">
                       <div>
                          <p className="text-xs font-black text-blue-700 uppercase tracking-tighter mb-1">Global Prime Brokerage S.A.</p>
                          <p className="text-[10px] text-slate-400 font-medium tracking-tight">Rondo Daszyńskiego 1, 00-843 Warszawa</p>
                       </div>
                       <div className="text-right">
                          <h2 className="text-lg font-black text-[#0F172A] tracking-tighter uppercase leading-none">Collateral Balance Statement</h2>
                          <p className="text-[10px] font-bold text-slate-400 mt-2">Okres: 01.04.2026 – 30.04.2026</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-16 mb-16">
                       <section 
                          ref={el => elementRefs.current['fundId'] = el}
                          className={`transition-all duration-500 p-2 -m-2 rounded-lg ${highlightedField === 'fundId' ? 'bg-yellow-100/40 shadow-[0_0_15px_rgba(250,204,21,0.1)] ring-1 ring-yellow-200' : ''}`}
                       >
                          <h5 className="text-[11px] font-black text-slate-900 border-b border-slate-900 mb-4 pb-1 uppercase tracking-widest">Dane Klienta</h5>
                          <div className="space-y-1.5">
                             <div className="flex gap-2"><span className="text-[10px] text-slate-400 font-bold min-w-[100px]">Nazwa podmiotu:</span><span className="text-[10px] font-black">Global Alpha Tech Fund</span></div>
                             <div className="flex gap-2"><span className="text-[10px] text-slate-400 font-bold min-w-[100px]">ID Funduszu:</span><span className="text-[10px] font-black text-blue-800">{analysisResult?.fundId}</span></div>
                             <div className="flex gap-2"><span className="text-[10px] text-slate-400 font-bold min-w-[100px]">Waluta bazowa:</span><span className="text-[10px] font-black uppercase text-blue-800">{analysisResult?.currency}</span></div>
                          </div>
                       </section>
                       <section>
                          <h5 className="text-[11px] font-black text-slate-400 border-b border-slate-100 mb-4 pb-1 uppercase tracking-widest">Dane Brokera</h5>
                          <div className="space-y-1.5 opacity-50">
                             <p className="text-[10px] font-bold">Infolinia: +48 22 XXX XX XX</p>
                             <p className="text-[10px] font-bold">Email: support@globalprime.pl</p>
                             <p className="text-[10px] font-bold">Licencja KNF nr: DMB/987/2026</p>
                          </div>
                       </section>
                    </div>

                    {/* Summary Table */}
                    <div className="mb-16">
                       <h5 className="text-[11px] font-black text-slate-900 mb-6 uppercase tracking-[0.2em] text-center italic">Executive Summary</h5>
                       <table className="w-full text-[11px]">
                          <thead>
                             <tr className="bg-[#0F172A] text-white font-bold text-[10px] tracking-wider text-left">
                                <th className="px-6 py-3">Wyszczególnienie</th>
                                <th className="px-6 py-3 text-right">Wartość Początkowa</th>
                                <th className="px-6 py-3 text-right">Wartość Końcowa</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                             <tr className="transition-all">
                                <td className="px-6 py-3 font-bold text-slate-700 underline decoration-slate-100 italic">Saldo Gotówkowe (Total Cash)</td>
                                <td 
                                  ref={el => elementRefs.current['openingBalance'] = el}
                                  className={`px-6 py-3 text-right font-mono tracking-tighter transition-all duration-500 relative ${highlightedField === 'openingBalance' ? 'bg-yellow-200/70 text-slate-900 rounded scale-[1.05] z-10 shadow-sm' : ''}`}
                                >
                                  {analysisResult?.cashOpening.toLocaleString(undefined, { minimumFractionDigits: 2 })} {analysisResult?.currency}
                                </td>
                                <td 
                                  ref={el => elementRefs.current['closingBalance'] = el}
                                  className={`px-6 py-3 text-right font-mono tracking-tighter transition-all duration-500 relative ${highlightedField === 'closingBalance' ? 'bg-yellow-200/70 text-slate-900 rounded scale-[1.05] z-10 shadow-sm' : ''}`}
                                >
                                  {analysisResult?.cashClosing.toLocaleString(undefined, { minimumFractionDigits: 2 })} {analysisResult?.currency}
                                </td>
                             </tr>
                             <tr className={`transition-all ${highlightedField === 'equities' ? 'bg-blue-50 font-black' : ''}`}>
                                <td className="px-6 py-3 font-bold text-slate-700">Wartość Aktywów (Equities & Bonds)</td>
                                <td className="px-6 py-3 text-right font-mono tracking-tighter">{analysisResult?.equitiesOpening.toLocaleString(undefined, { minimumFractionDigits: 2 })} {analysisResult?.currency}</td>
                                <td className="px-6 py-3 text-right font-mono tracking-tighter">{analysisResult?.equitiesClosing.toLocaleString(undefined, { minimumFractionDigits: 2 })} {analysisResult?.currency}</td>
                             </tr>
                             <tr className="bg-slate-50/50">
                                <td className="px-6 py-4 font-black uppercase text-[10px] tracking-wider">Wolne Środki (Free Margin)</td>
                                <td className="px-6 py-4 text-right font-black">{analysisResult?.freeMarginOpening.toLocaleString(undefined, { minimumFractionDigits: 2 })} {analysisResult?.currency}</td>
                                <td className="px-6 py-4 text-right font-black text-blue-700 text-sm">{analysisResult?.freeMarginClosing.toLocaleString(undefined, { minimumFractionDigits: 2 })} {analysisResult?.currency}</td>
                             </tr>
                          </tbody>
                       </table>
                    </div>

                    {/* Activity List */}
                    <div>
                       <h5 className="text-[11px] font-black text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-3">
                          <div className="h-px flex-1 bg-slate-200"></div> History of Transaction Activity <div className="h-px flex-1 bg-slate-200"></div>
                       </h5>
                       <table className="w-full text-[10px]">
                          <thead className="border-b-2 border-slate-900 text-slate-400 font-black uppercase">
                             <tr>
                                <th className="px-4 py-2 text-left">Data</th>
                                <th className="px-4 py-2 text-left">Typ</th>
                                <th className="px-4 py-2 text-left">Opis</th>
                                <th className="px-4 py-2 text-right">Wal.</th>
                                <th className="px-4 py-2 text-right">Kwota Netto</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 font-medium">
                             {analysisResult?.transactions.map((tx, idx) => (
                               <tr 
                                 key={idx} 
                                 ref={el => elementRefs.current[`tx-${idx}`] = el}
                                 className={`group hover:bg-slate-50 transition-all duration-300 ${highlightedField === `tx-${idx}` ? 'bg-yellow-50/60 font-bold border-l-2 border-yellow-400' : ''}`}
                               >
                                  <td className="px-4 py-3 text-slate-400">{tx.date}</td>
                                  <td className="px-4 py-3 font-bold">{tx.type}</td>
                                  <td className="px-4 py-3 max-w-[200px] truncate">{tx.description}</td>
                                  <td className="px-4 py-3 text-right font-black">{tx.currency}</td>
                                  <td className={`px-4 py-3 text-right font-black ${tx.amount < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>

                    <div className="absolute bottom-12 right-12 opacity-10 rotate-[-25deg] pointer-events-none">
                       <ShieldCheck size={120} />
                       <p className="text-[8px] font-black uppercase tracking-[1em] text-center mt-2">Verified</p>
                    </div>
                  </div>
                  )}

                  <div className="flex gap-4 justify-center pb-8 sticky bottom-0">
                     <StatusBadge icon={<CheckCircle2 size={12}/>} label="IDP VALIDATED" color="success" />
                     <StatusBadge icon={<FileSearch size={12}/>} label="STRUCT_DETECTOR_v4" color="info" />
                  </div>
                </motion.div>
              ) : (
                <div className="text-center h-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-200 rounded-3xl mx-12">
                   <div className="w-20 h-20 bg-white shadow-xl rounded-2xl flex items-center justify-center mb-8 text-slate-300">
                     <FileText size={40} />
                   </div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Wybierz dokument do walidacji</h3>
                   <p className="text-sm text-slate-500 mt-2 max-w-sm font-medium leading-relaxed">
                     Kliknij na wyciąg z listy po lewej lub prześlij plik ręcznie,<br/>aby rozpocząć proces inteligentnej ekstrakcji.
                   </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Column 3: AI Extraction Output */}
        <div className="w-[380px] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <LayoutDashboard size={16} className="text-blue-600" /> Rezultaty AI (Output)
            </h3>
            {analysisResult && (
              <button 
                onClick={handleReanalysis}
                disabled={isAnalyzing}
                className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${isAnalyzing ? 'text-slate-300' : 'text-slate-400 hover:text-blue-500'}`}
              >
                <RotateCcw size={10} className={isAnalyzing ? 'animate-spin' : ''} />
                Przeanalizuj ponownie
              </button>
            )}
          </div>

          {/* Output Template Selector */}
          {analysisResult && (
            <div className="px-5 py-4 border-b border-slate-100 bg-white shadow-[inset_0_-1px_3px_rgba(0,0,0,0.02)]">
              <label className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] block mb-2">Wybierz Szablon Outputu</label>
              <div className="relative group">
                <select 
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer hover:border-slate-300"
                >
                  {outputTemplates.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600 transition-colors pointer-events-none" />
              </div>
              <div className="mt-3 flex gap-1.5 flex-wrap">
                 {outputTemplates.find(t => t.id === selectedTemplateId)?.columns.map((col: any) => (
                   <span key={col.id} className="text-[8px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-tighter">
                     {col.name}
                   </span>
                 ))}
              </div>
            </div>
          )}

          {/* Quick Mapping Search - Searchable from 3rd section */}
          <div className="px-5 py-3 border-b border-slate-100 bg-white">
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Szybkie szukanie Mapowania..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={mappingSearch}
                  onChange={(e) => setMappingSearch(e.target.value)}
                />
                {mappingSearch && (
                  <button onClick={() => setMappingSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                    <X size={12} />
                  </button>
                )}
             </div>
             
             {mappingSearch && (
               <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-100 max-h-[150px] overflow-y-auto space-y-1">
                 {Object.entries(fundMappings).filter(([id]) => id.toLowerCase().includes(mappingSearch.toLowerCase())).map(([id, val]) => (
                   <div key={id} className="p-2 bg-white rounded border border-blue-50 flex flex-col gap-1">
                      <span className="text-[9px] font-black text-blue-700">{id}</span>
                      <span className="text-[10px] text-slate-600 font-bold truncate">{val}</span>
                   </div>
                 ))}
                 {Object.entries(fundMappings).filter(([id]) => id.toLowerCase().includes(mappingSearch.toLowerCase())).length === 0 && (
                   <p className="text-[9px] text-slate-400 text-center py-2 italic">Brak wyników</p>
                 )}
               </div>
             )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-3">
            {analysisResult ? (
              <>
                {/* Tile 1: Standard Extraction */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setExpandedResults(prev => prev.includes('standard') ? prev.filter(i => i !== 'standard') : [...prev, 'standard'])}
                    className="w-full px-5 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100 transition-colors border-b border-slate-100 group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Database size={14} />
                      </div>
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Standard Extraction</span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${expandedResults.includes('standard') ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {expandedResults.includes('standard') && (
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 space-y-6">
                          <div className="space-y-3">
                            <OutputRow 
                              label="Fund ID (Account ID)" 
                              value={analysisResult.fundId} 
                              onHover={() => setHighlightedField('fundId')} 
                              onLeave={() => setHighlightedField(null)}
                            />
                            <OutputRow 
                              label="Account Mapping" 
                              value={analysisResult.account || ''} 
                              error={!analysisResult.account} 
                            />
                            <OutputRow label="Base Currency" value={analysisResult.currency} small />
                            <OutputRow 
                              label="Equities/Bonds Valuation" 
                              value={`${analysisResult.equitiesClosing.toLocaleString()} ${analysisResult.currency}`} 
                              onHover={() => setHighlightedField('equities')} 
                              onLeave={() => setHighlightedField(null)}
                            />
                          </div>

                          <div className="bg-[#0F172A] text-white rounded-xl p-5 shadow-inner">
                            <div className="flex justify-between items-center group cursor-pointer" onMouseEnter={() => setHighlightedField('openingBalance')} onMouseLeave={() => setHighlightedField(null)}>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Balance Początkowy</span>
                                <span className="text-xs font-mono font-bold leading-none">{analysisResult.cashOpening.toLocaleString()} {analysisResult.currency}</span>
                            </div>
                            <div className="h-[1px] bg-white/10 my-4"></div>
                            <div 
                              className="flex justify-between items-center group cursor-pointer" 
                              onMouseEnter={() => setHighlightedField('closingBalance')} 
                              onMouseLeave={() => setHighlightedField(null)}
                            >
                                <div className="flex flex-col gap-1">
                                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Balance Końcowy</span>
                                  <div className="text-xs font-medium text-slate-400 text-[8px] italic leading-none">Verified via AI Engine</div>
                                </div>
                                <span className="text-lg font-black tracking-tighter text-blue-500 leading-none group-hover:text-white transition-colors">{analysisResult.cashClosing.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-[0.2em] flex justify-between items-center">
                              Extracted History
                              <span className="text-slate-400 text-[10px]">{analysisResult.transactions.length} records</span>
                            </h4>
                            <div className="space-y-2">
                              {analysisResult.transactions.slice(0, 3).map((tx, i) => (
                                <motion.div 
                                  key={i} 
                                  initial={{ x: 10 }}
                                  animate={{ x: 0 }}
                                  className="p-3 border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all cursor-crosshair group"
                                  onMouseEnter={() => setHighlightedField(`tx-${i}`)}
                                  onMouseLeave={() => setHighlightedField(null)}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-widest ${
                                      tx.type === 'Uznanie' || tx.type === 'Dividend' ? 'bg-green-100 text-green-700' : 
                                      tx.type === 'Zakup' || tx.type === 'Sprzedaż' || tx.type === 'Prowizja' ? 'bg-red-100 text-red-700' : 
                                      'bg-slate-100 text-slate-600'
                                    }`}>
                                      {tx.type}
                                    </span>
                                    <span className={`text-xs font-black ${tx.amount < 0 ? 'text-red-600' : 'text-slate-900'}`}>{tx.amount.toLocaleString()}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-600 font-bold leading-tight group-hover:text-blue-700">{tx.description}</p>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tile 2: Template-Specific Mapping */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setExpandedResults(prev => prev.includes('template') ? prev.filter(i => i !== 'template') : [...prev, 'template'])}
                    className="w-full px-5 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100 transition-colors border-b border-slate-100 group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <FileSpreadsheet size={14} />
                      </div>
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Mapping Template Results</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isTemplateAnalyzing && <RotateCcw size={12} className="animate-spin text-purple-500" />}
                      <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${expandedResults.includes('template') ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedResults.includes('template') && (
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 space-y-4">
                          {isTemplateAnalyzing ? (
                            <div className="py-12 space-y-4 flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                                Custom Analysis in progress...<br/>
                                <span className="text-purple-500 font-bold">Refining output based on Template instructions</span>
                              </p>
                            </div>
                          ) : templateAnalysisResult ? (
                            <div className="space-y-3">
                              {Object.entries(templateAnalysisResult).map(([key, value]: [string, any]) => (
                                <OutputRow 
                                  key={key}
                                  label={key}
                                  value={String(value)}
                                  small
                                />
                              ))}
                              {Object.keys(templateAnalysisResult).length === 0 && (
                                <p className="text-[10px] text-slate-400 font-bold text-center py-4">Brak kolumn w wybranym szablonie</p>
                              )}
                            </div>
                          ) : (
                            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Analiza w toku lub oczekiwanie na szablon...</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 m-2">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 text-slate-200">
                  <LayoutDashboard size={32} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Oczekiwanie na dane</h4>
                <p className="text-[10px] mt-2 font-medium leading-relaxed max-w-[180px] mx-auto">AI przeanalizuje dokument i wyświetli ustrukturyzowany output tutaj.</p>
              </div>
            )}
          </div>

          {analysisResult && (
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-3 shrink-0">
              {!analysisResult.account && (
                <div 
                  className="w-full bg-orange-50 border border-orange-200 text-orange-800 text-[10px] font-black h-10 rounded-xl flex items-center justify-center gap-2"
                >
                  <AlertCircle size={14} /> Wymagana eskalacja do Service Delivery
                </div>
              )}
              <div className="flex gap-2">
                <button 
                  onClick={handleExport}
                  disabled={!analysisResult.account}
                  className={`flex-1 text-white text-[11px] font-black h-10 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all border-b-4 ${
                    analysisResult.account 
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 border-blue-800' 
                    : 'bg-slate-300 cursor-not-allowed border-slate-400'
                  }`}
                >
                  <Download size={16} /> Eksportuj do Excel (CSV)
                </button>
                <button 
                  onClick={markFileAsDone}
                  className={`aspect-square w-10 flex items-center justify-center rounded-xl border-b-4 transition-all shadow-lg bg-slate-900 border-slate-950 hover:bg-green-600 hover:border-green-800 text-white`}
                  title="Zatwierdź bez eksportu"
                >
                  <Check size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
          </>
        ) : (
          /* Rules & Mappings View */
          <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-[#0F172A] text-white">
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <h2 className="text-lg font-black tracking-tighter">Database: Rules & Fund Mappings</h2>
                  <p className="text-slate-400 text-[10px] font-medium">Manage how AI connects extracted Fund IDs to internal Accounts.</p>
                </div>
                <div className="flex gap-4">
                  <div className="relative w-56">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Filtruj bazę danych..." 
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/50"
                      value={mappingSearch}
                      onChange={(e) => setMappingSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Sub Navigation */}
              <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/10 w-fit">
                <button 
                  onClick={() => setRulesSubView('fund')}
                  className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    rulesSubView === 'fund' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Key size={10} />
                  Fund Mapping
                </button>
                <button 
                  onClick={() => setRulesSubView('output')}
                  className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    rulesSubView === 'output' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileSpreadsheet size={10} />
                  Output Mapping
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
              {rulesSubView === 'fund' ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-600">Utwórz nowe połączenie Fundusz &rarr; Konto</span>
                    <button 
                      onClick={() => {
                        let baseId = "NOWY_FUND";
                        let finalId = baseId;
                        let counter = 1;
                        while (fundMappings[finalId]) {
                          finalId = `${baseId}_${counter}`;
                          counter++;
                        }
                        
                        setFundMappings(prev => ({ [finalId]: 'Nowe_Konto', ...prev }));
                        setExpandedFundId(finalId);
                        addNotification(`Dodano fundusz: ${finalId}`, 'success');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Save size={12} />
                      Dodaj Fundusz
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(fundMappings).filter(([id]) => id.toLowerCase().includes(mappingSearch.toLowerCase())).map(([fundId, account]) => {
                      const isExpanded = expandedFundId === fundId;
                      return (
                        <motion.div 
                          layout
                          key={fundId}
                          onClick={() => setExpandedFundId(isExpanded ? null : fundId)}
                          className={`p-4 bg-white border rounded-xl transition-all group cursor-pointer ${isExpanded ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300 shadow-sm'}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 max-w-[calc(100%-24px)]">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${isExpanded ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                <Key size={12} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Fund ID</span>
                                {isExpanded ? (
                                  <input 
                                    type="text"
                                    value={fundId}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      const newVal = e.target.value.toUpperCase().replace(/\s/g, '_');
                                      if (newVal === fundId) return;
                                      
                                      setFundMappings(prev => {
                                        const next = { ...prev };
                                        const accountVal = next[fundId];
                                        // To maintain order prepend properly
                                        const orderedNext: any = {};
                                        Object.entries(next).forEach(([k, v]) => {
                                          if (k === fundId) orderedNext[newVal] = accountVal;
                                          else orderedNext[k] = v;
                                        });
                                        return orderedNext;
                                      });
                                      setExpandedFundId(newVal);
                                    }}
                                    className="text-sm font-black text-slate-900 tracking-tight leading-none bg-blue-50/50 border-b border-blue-500 focus:outline-none w-full"
                                  />
                                ) : (
                                  <span className="text-sm font-black text-slate-900 tracking-tight leading-none truncate block">{fundId}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFundMappings(prev => {
                                    const next = { ...prev };
                                    delete next[fundId];
                                    return next;
                                  });
                                  addNotification(`Usunięto mapowanie ${fundId}`, 'info');
                                }}
                                className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-md transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <div className={`p-2.5 rounded-lg border transition-colors ${isExpanded ? 'bg-white border-blue-100' : 'bg-slate-50 border-slate-100 group-hover:bg-blue-50/30'}`}>
                            <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest block mb-0.5">Account</span>
                            {isExpanded ? (
                              <input 
                                type="text"
                                value={account}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  setFundMappings(prev => ({ ...prev, [fundId]: e.target.value }));
                                }}
                                className="text-[10px] font-bold text-slate-700 bg-transparent border-b border-blue-200 focus:border-blue-500 focus:outline-none w-full"
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-slate-700 truncate block">{account}</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-600">Skonfiguruj szablon eksportu (Output Template)</span>
                      <span className="text-[10px] text-slate-400 font-medium">Zdefiniuj kolumny dla Twoich raportów Excel.</span>
                    </div>
                    <button 
                      onClick={() => {
                        let baseName = "Nowa Nazwa";
                        let finalName = baseName;
                        let counter = 1;
                        while (outputTemplates.some(t => t.name.toLowerCase() === finalName.toLowerCase())) {
                          finalName = `${baseName} ${counter}`;
                          counter++;
                        }
                        
                        const newId = `tpl_${Date.now()}`;
                        const newTpl = { id: newId, name: finalName, columns: [], customPrompt: '' };
                        setOutputTemplates(prev => [newTpl, ...prev]);
                        setExpandedTemplateId(newId); // Auto-expand new template
                        addNotification(`Utworzono szablon: ${finalName}`, 'success');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Save size={12} />
                      Nowy Szablon
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {outputTemplates.map(tpl => {
                      const isExpanded = expandedTemplateId === tpl.id;
                      return (
                        <div key={tpl.id} className={`bg-white rounded-xl border transition-all duration-300 ${isExpanded ? 'border-blue-500 shadow-md' : 'border-slate-200 hover:border-slate-300 shadow-sm'}`}>
                          <div 
                            onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                            className="p-4 flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                <FileSpreadsheet size={20} />
                              </div>
                              <div className="flex flex-col">
                                {isExpanded ? (
                                  <input 
                                    type="text"
                                    value={tpl.name}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setOutputTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, name: val } : t));
                                    }}
                                    onBlur={(e) => {
                                      const val = e.target.value.trim() || 'Nowa Nazwa';
                                      const others = outputTemplates.filter(t => t.id !== tpl.id);
                                      if (others.some(t => t.name.toLowerCase() === val.toLowerCase())) {
                                        let final = val;
                                        let c = 1;
                                        while (others.some(t => t.name.toLowerCase() === final.toLowerCase())) {
                                          final = `${val} ${c}`;
                                          c++;
                                        }
                                        setOutputTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, name: final } : t));
                                        addNotification(`Nazwa zajęta. Zmieniono na: ${final}`, 'info');
                                      } else if (val !== e.target.value) {
                                        setOutputTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, name: val } : t));
                                      }
                                    }}
                                    className="font-black text-slate-900 tracking-tight uppercase text-xs border-b border-blue-500 bg-blue-50/30 px-1 focus:outline-none transition-all w-48"
                                  />
                                ) : (
                                  <h3 className="font-black text-slate-900 tracking-tight uppercase text-xs">{tpl.name}</h3>
                                )}
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold">{tpl.columns.length} Kolumn</span>
                                  {tpl.customPrompt && (
                                    <span className="text-[8px] font-bold text-purple-500 flex items-center gap-1">
                                      <BrainCircuit size={8} /> Aktywny Prompt
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOutputTemplates(prev => prev.filter(t => t.id !== tpl.id));
                                }}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-all"
                                title="Usuń"
                              >
                                <Trash2 size={14} />
                              </button>
                              <div className={`p-1 rounded-lg transition-all ${isExpanded ? 'bg-blue-50 text-blue-600' : 'text-slate-300'}`}>
                                <ChevronDown size={18} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-0 border-t border-slate-50">
                                  <div className="flex flex-col gap-4 mt-4">
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Kolumny Raportu</span>
                                      </div>
                                      <Reorder.Group 
                                        axis="x" 
                                        values={tpl.columns} 
                                        onReorder={(newOrder) => {
                                          setOutputTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, columns: newOrder } : t));
                                        }}
                                        className="flex flex-wrap gap-2"
                                      >
                                        {tpl.columns.map((col: any) => (
                                          <Reorder.Item 
                                            key={col.id} 
                                            value={col}
                                            className="flex items-center"
                                          >
                                            <div className="flex items-center gap-1 px-2 py-1.5 bg-blue-50/50 border border-blue-100 rounded-lg text-[9px] font-bold text-blue-700 group/col hover:border-blue-400 transition-all">
                                              <GripVertical size={10} className="text-blue-300 cursor-grab active:cursor-grabbing shrink-0" />
                                              <input 
                                                type="text"
                                                value={col.name}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => {
                                                  const newName = e.target.value;
                                                  setOutputTemplates(prev => prev.map(t => t.id === tpl.id ? { 
                                                    ...t, 
                                                    columns: t.columns.map(c => c.id === col.id ? { ...c, name: newName } : c) 
                                                  } : t));
                                                }}
                                                className="bg-transparent border-none outline-none focus:ring-0 w-20 text-[9px] font-bold"
                                              />
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOutputTemplates(prev => prev.map(t => t.id === tpl.id ? { 
                                                    ...t, 
                                                    columns: t.columns.filter(c => c.id !== col.id) 
                                                  } : t));
                                                }}
                                                className="hover:text-red-500 opacity-0 group-hover/col:opacity-100 transition-opacity p-0.5"
                                              >
                                                <X size={8} />
                                              </button>
                                            </div>
                                          </Reorder.Item>
                                        ))}
                                        <button 
                                          onClick={() => {
                                            const newCol = { id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, name: "Nowa Kolumna" };
                                            setOutputTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, columns: [...t.columns, newCol] } : t));
                                          }}
                                          className="px-2 py-1 border border-dashed border-slate-300 rounded-lg text-[9px] font-bold text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all uppercase tracking-widest"
                                        >
                                          + Dodaj
                                        </button>
                                      </Reorder.Group>
                                    </div>

                                    <div className="space-y-2 pt-3 border-t border-slate-100">
                                      <div className="flex items-center gap-2 mb-1">
                                        <BrainCircuit size={12} className="text-purple-600" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Instrukcje dla AI</span>
                                      </div>
                                      <textarea 
                                        placeholder="Np. 'Zwróć szczególną uwagę na tabelę Summary of Cash...'"
                                        maxLength={3000}
                                        className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                        value={tpl.customPrompt || ''}
                                        onChange={(e) => {
                                          setOutputTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, customPrompt: e.target.value } : t));
                                        }}
                                      />
                                      <div className="flex justify-end">
                                        <span className="text-[8px] font-bold text-slate-400">{(tpl.customPrompt?.length || 0)} / 3000 znaków</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Global Toast Notifications */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col-reverse gap-4">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div 
              key={n.id}
              initial={{ x: 50, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-4 pr-12 rounded-2xl shadow-2xl border-l-[6px] min-w-[280px] flex items-center gap-4 bg-white/95 backdrop-blur-xl relative group ${
                n.type === 'success' ? 'border-green-500 text-green-700 shadow-green-500/10' : 
                n.type === 'error' ? 'border-red-500 text-red-700 shadow-red-500/10' : 
                'border-blue-500 text-blue-700 shadow-blue-500/10'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                n.type === 'success' ? 'bg-green-50' : n.type === 'error' ? 'bg-red-50' : 'bg-blue-50'
              }`}>
                {n.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black leading-none mb-1 uppercase tracking-wider">{n.type === 'error' ? 'Security Violation' : 'System Alert'}</span>
                <span className="text-xs font-bold leading-tight">{n.message}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setNotifications(prev => prev.filter(notif => notif.id !== n.id));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-black/5 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden text-slate-900"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Settings2 size={18} />
                  </div>
                  <h3 className="font-bold text-slate-900 leading-none">Settings & AI Configuration</h3>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-md text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Google Gemini API Key</label>
                  <div className="relative">
                    <input 
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="Paste your API key here..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                    <Key size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400 leading-relaxed font-medium">
                    Klucz jest zapisywany wyłącznie w Twojej przeglądarce (localStorage). Zostanie on użyty do analizy dokumentów zamiast klucza systemowego.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Mail size={14} className="text-blue-600" />
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Połączenie Outlook</label>
                  </div>
                  <div className="space-y-3">
                    <input 
                      type="email"
                      value={outlookForm.email}
                      onChange={(e) => setOutlookForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Adres email Outlook"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                    <input 
                      type="password"
                      value={outlookForm.password}
                      onChange={(e) => setOutlookForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Hasło"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                    <button 
                      onClick={() => {
                        if (!outlookForm.email || !outlookForm.password) {
                          addNotification("Podaj email i hasło Outlook", "error");
                          return;
                        }
                        setOutlookConfig({
                          ...outlookForm,
                          isConnected: true
                        });
                        addNotification("Połączono ze skrzynką Outlook", "success");
                      }}
                      className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${outlookConfig.isConnected ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'}`}
                    >
                      {outlookConfig.isConnected ? 'Zmieniono połączenie' : 'Połącz Skrzynkę'}
                    </button>
                    {outlookConfig.isConnected && (
                      <p className="text-[9px] text-green-600 font-bold text-center">✓ Aktywne połączenie: {outlookConfig.email}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                >
                  Anuluj
                </button>
                <button 
                  onClick={saveApiKey}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                >
                  Zapisz Zmiany
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUserModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="bg-[#0F172A] p-6 text-white relative">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-400/30">
                     <ShieldCheck className="text-blue-400" size={24} />
                   </div>
                   <div>
                     <h2 className="text-xl font-bold">Autoryzacja użytkownika</h2>
                     <p className="text-blue-300/60 text-xs font-medium">Poświadcz tożsamość aby zmienić sesję</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => setIsUserModalOpen(false)}
                   className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
                 >
                   <X size={20} />
                 </button>
              </div>

              <div className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Imię</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Wpisz imię..."
                      value={loginForm.firstName}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nazwisko</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Wpisz nazwisko..."
                      value={loginForm.lastName}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Aktualne stanowisko</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="np. Senior Fund Accountant"
                    value={loginForm.position}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, position: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Hasło zabezpieczające</label>
                  <div className="relative">
                    <input 
                      type="password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Min. 1 znak"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => {
                      if (!loginForm.firstName || !loginForm.lastName || !loginForm.position || !loginForm.password) {
                        addNotification("Wszystkie pola (w tym hasło) są wymagane!", "error");
                        return;
                      }
                      
                      setUserProfile({
                        firstName: loginForm.firstName,
                        lastName: loginForm.lastName,
                        position: loginForm.position
                      });
                      // Reset mailbox connection on user switch as requested
                      setOutlookConfig(prev => ({ ...prev, isConnected: false }));
                      setIsUserModalOpen(false);
                      addNotification(`Zalogowano jako: ${loginForm.firstName} ${loginForm.lastName}`, "success");
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
                  >
                    Przełącz użytkownika
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Internal View Components ---

function HeaderNav({ label, active = false, onClick = () => {} }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 h-full text-[11px] font-black uppercase tracking-[0.15em] flex items-center transition-all relative group ${
        active ? 'text-white' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {label}
      {active && (
        <motion.div layoutId="header-nav-active" className="absolute bottom-0 left-0 w-full h-1 bg-blue-500" />
      )}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors"></div>
    </button>
  );
}

function StatusBadge({ icon, label, color }) {
  const styles = {
    success: 'bg-green-500/10 text-green-600 border-green-500/20',
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-[9px] font-black uppercase tracking-[0.1em] backdrop-blur-md shadow-sm ${styles[color]}`}>
      {icon} {label}
    </div>
  );
}

function OutputRow({ 
  label, 
  value, 
  error = false, 
  status = null, 
  small = false, 
  onHover = () => {}, 
  onLeave = () => {} 
}: {
  label: any,
  value: any,
  error?: boolean,
  status?: any,
  small?: boolean,
  onHover?: () => void,
  onLeave?: () => void,
  key?: any
}) {
  return (
    <div 
      className={`p-4 rounded-xl border-2 transition-all group ${
        error ? 'bg-red-50 border-red-200 shadow-sm shadow-red-100' : 'bg-white border-slate-50 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5'
      } ${small ? 'p-3' : 'p-4'}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{label}</span>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-black truncate leading-none ${
          error ? 'text-red-700' : status === 'success' ? 'text-green-600' : 'text-slate-900 group-hover:text-blue-700'
        }`}>
          {value}
        </p>
        <ExternalLink size={10} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
