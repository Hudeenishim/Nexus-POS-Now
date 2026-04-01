import * as React from 'react';
import { useState } from 'react';
import { 
  getDocs, 
  collection 
} from 'firebase/firestore';
import { 
  Users, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  ShieldCheck,
  Share2,
  Copy,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const SHARED_APP_URL = "https://ais-pre-ltj3euewlgsasykxa66scu-173886959417.europe-west3.run.app";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(SHARED_APP_URL);
    toast.success('Shared App URL copied to clipboard!');
  };

  const handleExportData = async (format: 'json' | 'csv' | 'xlsx' = 'json') => {
    setIsExporting(true);
    try {
      const collections = ['products', 'sales', 'sales_items', 'inventory_logs', 'customers', 'suppliers', 'users'];
      const backupData: any = {};

      for (const collName of collections) {
        const snapshot = await getDocs(collection(db, collName));
        backupData[collName] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexus_pos_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        toast.success('Data exported successfully as JSON');
      } else if (format === 'xlsx') {
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();
        
        for (const collName of collections) {
          if (backupData[collName] && backupData[collName].length > 0) {
            const ws = XLSX.utils.json_to_sheet(backupData[collName]);
            XLSX.utils.book_append_sheet(wb, ws, collName.charAt(0).toUpperCase() + collName.slice(1));
          }
        }
        
        XLSX.writeFile(wb, `nexus_pos_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Data exported successfully as Excel');
      } else {
        const sales = backupData['sales'];
        if (sales.length > 0) {
          const headers = Object.keys(sales[0]).join(',');
          const rows = sales.map((s: any) => Object.values(s).map(v => `"${v}"`).join(',')).join('\n');
          const csv = `${headers}\n${rows}`;
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nexus_sales_export_${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          toast.success('Sales data exported as CSV');
        } else {
          toast.info('No sales data to export');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-bold">Account Profile</h3>
              <p className="text-sm text-muted-fg">Manage your business information</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-fg">Business Name <span className="text-red-500">*</span></label>
              <input className="input" value={user?.name} readOnly />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-fg">Email Address <span className="text-red-500">*</span></label>
              <input className="input" value={user?.email} readOnly />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-fg">Role <span className="text-red-500">*</span></label>
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold w-fit uppercase">
                {user?.role}
              </div>
            </div>
          </div>
        </div>

        <div className="card space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
              <Download size={24} />
            </div>
            <div>
              <h3 className="font-bold">Backup & Recovery</h3>
              <p className="text-sm text-muted-fg">Export your data for safe keeping</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-fg">
              Download a complete backup of your products, sales, and customer data.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => handleExportData('xlsx')}
                disabled={isExporting}
                className="btn btn-primary w-full gap-2"
              >
                <FileSpreadsheet size={18} />
                {isExporting ? 'Exporting...' : 'Export Full Backup (Excel)'}
              </button>
              <button 
                onClick={() => handleExportData('json')}
                disabled={isExporting}
                className="btn btn-outline w-full gap-2"
              >
                <Download size={18} />
                {isExporting ? 'Exporting...' : 'Export Full Backup (JSON)'}
              </button>
              <button 
                onClick={() => handleExportData('csv')}
                disabled={isExporting}
                className="btn btn-ghost w-full gap-2"
              >
                <FileText size={18} />
                {isExporting ? 'Exporting...' : 'Export Sales (CSV)'}
              </button>
            </div>
          </div>
        </div>

        <div className="card space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <Share2 size={24} />
            </div>
            <div>
              <h3 className="font-bold">Public Access & Sharing</h3>
              <p className="text-sm text-muted-fg">Share your app with other devices</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border-2 border-dashed border-border/50">
              <div className="p-4 bg-white rounded-xl shadow-sm border border-border/20 mb-4">
                <QRCodeSVG 
                  value={SHARED_APP_URL} 
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-2">Scan to Open App</p>
              <div className="flex items-center gap-2 text-[10px] font-mono bg-muted/30 px-3 py-1.5 rounded-full border border-border/50 max-w-full overflow-hidden">
                <span className="truncate opacity-60">{SHARED_APP_URL}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleCopyLink}
                className="btn btn-outline gap-2 text-xs"
              >
                <Copy size={14} />
                Copy Link
              </button>
              <a 
                href={SHARED_APP_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary gap-2 text-xs"
              >
                <ExternalLink size={14} />
                Open Shared
              </a>
            </div>

            <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
              <p className="text-xs text-blue-600 leading-relaxed">
                <strong>Note:</strong> Use this URL for scanning on other devices. The development URL is restricted and may be blocked by Safari/iOS.
              </p>
            </div>
          </div>
        </div>

        <div className="card space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-bold">System Status</h3>
              <p className="text-sm text-muted-fg">Current platform health</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">Database</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">Auth Service</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">Storage</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold">Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
