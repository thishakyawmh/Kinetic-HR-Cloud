import React, { useState, useRef } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Users,
  Building2,
  GitFork,
  Download,
  Trash2,
  Layers,
  Sparkles,
  Loader2,
  Check,
  RefreshCw,
} from 'lucide-react'
import { employeeService } from '@/services/employeeService'

interface BulkImportWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  existingDepartments?: string[]
}

type ImportMode = 'auto_split' | 'fixed_department'

interface ColumnMapping {
  name: string
  employeeNumber: string
  email: string
  department: string
  jobTitle: string
  role: string
  managerNumber: string
  phone: string
  hireDate: string
  location: string
}

export const BulkImportWizardModal: React.FC<BulkImportWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingDepartments = [],
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [mode, setMode] = useState<ImportMode>('auto_split')
  const [targetDepartment, setTargetDepartment] = useState<string>('')
  const [customNewDepartment, setCustomNewDepartment] = useState<string>('')

  // File state
  const [file, setFile] = useState<File | null>(null)
  const [fileHeaders, setFileHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Array<Record<string, any>>>([])
  const [isParsing, setIsParsing] = useState<boolean>(false)

  // Column Mapping
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: '',
    employeeNumber: '',
    email: '',
    department: '',
    jobTitle: '',
    role: '',
    managerNumber: '',
    phone: '',
    hireDate: '',
    location: '',
  })

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    importedCount: number
    createdDepartments: string[]
    linkedManagersCount: number
    departmentBreakdown?: Record<string, number>
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helper to parse CSV text into headers and rows
  const parseCSVText = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0)
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and 1 data row.')
    }

    // Parse CSV line handling quotes
    const parseLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''))
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''))
      return result
    }

    const headers = parseLine(lines[0])
    const rows: Array<Record<string, any>> = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i])
      if (values.length === 0 || (values.length === 1 && !values[0])) continue

      const rowObj: Record<string, any> = {}
      headers.forEach((header, idx) => {
        rowObj[header] = values[idx] || ''
      })
      rows.push(rowObj)
    }

    return { headers, rows }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    processFile(selectedFile)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (!droppedFile) return
    processFile(droppedFile)
  }

  const processFile = (fileToProcess: File) => {
    setFile(fileToProcess)
    setIsParsing(true)
    setErrorMsg(null)

    const reader = new FileReader()
    reader.onload = event => {
      try {
        const content = event.target?.result as string
        const { headers, rows } = parseCSVText(content)
        setFileHeaders(headers)
        setRawRows(rows)

        // Auto-match headers to Kinetic fields
        const autoMap: ColumnMapping = {
          name: headers.find(h => /name|full_name|fullname|employee_name/i.test(h)) || headers[0] || '',
          employeeNumber: headers.find(h => /id|emp_id|employee_id|staff_id|emp_no|number/i.test(h)) || headers[1] || '',
          email: headers.find(h => /email|mail|work_email/i.test(h)) || '',
          department: headers.find(h => /dept|department|division|team|branch/i.test(h)) || '',
          jobTitle: headers.find(h => /title|job|designation|role_name|position/i.test(h)) || '',
          role: headers.find(h => /^role$|system_role|access/i.test(h)) || '',
          managerNumber: headers.find(h => /manager|reports_to|supervisor|lead_id/i.test(h)) || '',
          phone: headers.find(h => /phone|mobile|contact|tel/i.test(h)) || '',
          hireDate: headers.find(h => /hire|joined|start_date|date/i.test(h)) || '',
          location: headers.find(h => /location|branch_name|office|city/i.test(h)) || '',
        }
        setMapping(autoMap)
        setIsParsing(false)
        setStep(3)
      } catch (err: any) {
        setIsParsing(false)
        setErrorMsg(err.message || 'Failed to parse file. Please upload a valid CSV file.')
      }
    }
    reader.onerror = () => {
      setIsParsing(false)
      setErrorMsg('Error reading file from disk.')
    }
    reader.readAsText(fileToProcess)
  }

  // Generate Sample CSV Template
  const downloadSampleTemplate = () => {
    const csvContent =
      'Employee ID,Full Name,Official Email,Department,Designation,Reports To ID,Mobile Phone,Hire Date,Branch\n' +
      'EMP-1001,Kasun Perera,kasun.perera@company.lk,Retail Banking,Senior Credit Officer,,+94 77 123 4567,2022-01-15,Colombo Fort\n' +
      'EMP-1002,Dinuka Jayakody,dinuka.j@company.lk,Retail Banking,Credit Officer,EMP-1001,+94 77 234 5678,2023-04-10,Colombo Fort\n' +
      'EMP-1003,Thilini Silva,thilini.s@company.lk,Treasury Operations,Operations Specialist,EMP-1001,+94 77 345 6789,2021-08-01,Colombo Fort\n' +
      'EMP-1004,Nuwan Jayasuriya,nuwan.j@company.lk,Corporate Credit,Credit Analyst,EMP-1001,+94 77 456 7890,2024-02-15,Kandy Regional\n'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Kinetic_HR_Sample_Staff_Template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Execute Import
  const handleExecuteImport = async () => {
    setIsSubmitting(true)
    setErrorMsg(null)

    const finalTargetDept = targetDepartment === 'custom' ? customNewDepartment : targetDepartment

    try {
      const response = await employeeService.bulkImportEmployees({
        mode,
        targetDepartment: finalTargetDept,
        departmentColumn: mapping.department,
        columnMapping: mapping,
        dataset: rawRows,
      })

      setImportResult(response)
      onSuccess()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to complete bulk import.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset wizard
  const resetWizard = () => {
    setStep(1)
    setFile(null)
    setFileHeaders([])
    setRawRows([])
    setImportResult(null)
    setErrorMsg(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
        <Card className="max-w-4xl w-full max-h-[90vh] bg-card border border-border/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="p-6 border-b border-border/60 bg-muted/20 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#23ace3]/15 text-[#23ace3] flex items-center justify-center">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-foreground">Enterprise Staff Import Wizard</h2>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  Direct Ingestion
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Bulk upload employee rosters from CSV or Excel files with auto-department detection and hierarchy wiring.
              </p>
            </div>

            {/* Step Indicators */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono">
              {[
                { num: 1, label: 'Mode' },
                { num: 2, label: 'Upload' },
                { num: 3, label: 'Mapping' },
                { num: 4, label: 'Preview' },
              ].map(s => (
                <div
                  key={s.num}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    step === s.num
                      ? 'bg-[#23ace3] text-white'
                      : step > s.num
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  <span>{s.num}.</span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-xs">Validation Notice:</span>
                  <p className="text-xs text-rose-300/90">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* ===============================================================
                SUCCESS RESULT SCREEN
               =============================================================== */}
            {importResult ? (
              <div className="py-8 text-center space-y-5">
                <div className="h-16 w-16 mx-auto rounded-3xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center animate-in zoom-in-75">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-foreground">Staff Import Successfully Completed!</h3>
                  <p className="text-xs text-muted-foreground">{importResult.message}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto pt-2">
                  <Card className="p-4 bg-muted/30 border border-border/60 rounded-2xl text-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Staff Created</span>
                    <span className="text-2xl font-black font-mono text-foreground">{importResult.importedCount}</span>
                  </Card>
                  <Card className="p-4 bg-muted/30 border border-border/60 rounded-2xl text-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">New Departments</span>
                    <span className="text-2xl font-black font-mono text-[#23ace3]">
                      {importResult.createdDepartments.length}
                    </span>
                  </Card>
                  <Card className="p-4 bg-muted/30 border border-border/60 rounded-2xl text-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Manager Links</span>
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      {importResult.linkedManagersCount}
                    </span>
                  </Card>
                </div>

                {importResult.createdDepartments.length > 0 && (
                  <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 max-w-md mx-auto text-xs text-sky-300">
                    <span className="font-semibold block mb-1">Provisioned Department Workspaces:</span>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {importResult.createdDepartments.map((d, i) => (
                        <Badge key={i} variant="outline" className="bg-sky-500/20 text-sky-200 border-sky-500/40">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-center gap-3">
                  <Button
                    onClick={() => {
                      resetWizard()
                      onClose()
                    }}
                    className="bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold rounded-xl px-6"
                  >
                    Done & Refresh Staff Directory
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* ===============================================================
                    STEP 1: SELECT IMPORT MODE
                   =============================================================== */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-foreground">Step 1: Choose Your Dataset Structure</h3>
                      <p className="text-xs text-muted-foreground">
                        Select how your spreadsheet is structured so the system can organize departments properly.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Mode A: All-in-One Bulk */}
                      <div
                        onClick={() => setMode('auto_split')}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                          mode === 'auto_split'
                            ? 'border-[#23ace3] bg-[#23ace3]/5 shadow-md shadow-[#23ace3]/5'
                            : 'border-border/60 hover:border-border bg-card'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="h-10 w-10 rounded-xl bg-[#23ace3]/15 text-[#23ace3] flex items-center justify-center font-bold">
                            <Layers className="h-5 w-5" />
                          </div>
                          {mode === 'auto_split' && (
                            <Badge className="bg-[#23ace3] text-white text-[10px]">Selected</Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-foreground">All-in-One Company File</h4>
                          <span className="text-[10px] text-[#23ace3] font-semibold uppercase tracking-wider block">
                            Auto-Split by Department Column
                          </span>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Upload your entire company in one file. The system inspects the Department column, auto-groups employees, and provisions any missing departments automatically.
                          </p>
                        </div>
                      </div>

                      {/* Mode B: Department-Specific */}
                      <div
                        onClick={() => setMode('fixed_department')}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                          mode === 'fixed_department'
                            ? 'border-[#23ace3] bg-[#23ace3]/5 shadow-md shadow-[#23ace3]/5'
                            : 'border-border/60 hover:border-border bg-card'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="h-10 w-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
                            <Building2 className="h-5 w-5" />
                          </div>
                          {mode === 'fixed_department' && (
                            <Badge className="bg-purple-600 text-white text-[10px]">Selected</Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-foreground">Department-Specific File</h4>
                          <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider block">
                            Assign All Rows to One Team
                          </span>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Upload a spreadsheet containing staff for a single department. All employees will be assigned directly to your selected department.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Department Dropdown if fixed_department */}
                    {mode === 'fixed_department' && (
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 space-y-3 animate-in fade-in">
                        <label className="text-xs font-bold text-foreground block">
                          Select Target Department for this Spreadsheet:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <select
                            value={targetDepartment}
                            onChange={e => setTargetDepartment(e.target.value)}
                            className="w-full bg-card border border-border/80 rounded-xl p-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-[#23ace3]"
                          >
                            <option value="">-- Choose Existing Department --</option>
                            {existingDepartments.map(dept => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                            <option value="custom">+ Create New Department...</option>
                          </select>

                          {targetDepartment === 'custom' && (
                            <input
                              type="text"
                              placeholder="Enter New Department Name..."
                              value={customNewDepartment}
                              onChange={e => setCustomNewDepartment(e.target.value)}
                              className="w-full bg-card border border-border/80 rounded-xl p-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-[#23ace3]"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ===============================================================
                    STEP 2: FILE DRAG & DROP
                   =============================================================== */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-foreground">Step 2: Upload CSV File</h3>
                        <p className="text-xs text-muted-foreground">
                          Drop your spreadsheet file below or use our standard template.
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadSampleTemplate}
                        className="text-xs gap-1.5 border-border/80 text-[#23ace3] hover:text-[#1b97ca]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Template</span>
                      </Button>
                    </div>

                    {/* Drop Zone */}
                    <div
                      onDragOver={e => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border/80 hover:border-[#23ace3] rounded-3xl p-8 text-center cursor-pointer transition-colors bg-muted/10 hover:bg-[#23ace3]/5 space-y-3"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".csv,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="h-14 w-14 mx-auto rounded-2xl bg-[#23ace3]/15 text-[#23ace3] flex items-center justify-center">
                        <UploadCloud className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-foreground block">
                          Click to Browse or Drag & Drop File
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          Supports CSV files (.csv) exported from Excel, SAP, or legacy databases
                        </span>
                      </div>
                    </div>

                    {file && (
                      <div className="p-4 rounded-2xl bg-card border border-border/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                          <div>
                            <span className="font-bold text-xs text-foreground block">{file.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB • {rawRows.length} rows detected
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFile(null)
                            setRawRows([])
                          }}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* ===============================================================
                    STEP 3: COLUMN MAPPER
                   =============================================================== */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">Step 3: Map Spreadsheet Columns</h3>
                        <Badge variant="outline" className="bg-[#23ace3]/15 text-[#23ace3] border-[#23ace3]/30 text-[10px]">
                          {rawRows.length} Data Rows Found
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Match your spreadsheet column names to Kinetic HR Cloud fields.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border border-border/60">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                          <span>Full Name *</span>
                          <span className="text-[10px] text-muted-foreground">Required</span>
                        </label>
                        <select
                          value={mapping.name}
                          onChange={e => setMapping({ ...mapping, name: e.target.value })}
                          className="w-full bg-card border border-border/80 rounded-xl p-2 text-xs text-foreground"
                        >
                          <option value="">-- Select Column --</option>
                          {fileHeaders.map(h => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Employee ID */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                          <span>Employee ID / Number *</span>
                          <span className="text-[10px] text-muted-foreground">Required Anchor</span>
                        </label>
                        <select
                          value={mapping.employeeNumber}
                          onChange={e => setMapping({ ...mapping, employeeNumber: e.target.value })}
                          className="w-full bg-card border border-border/80 rounded-xl p-2 text-xs text-foreground"
                        >
                          <option value="">-- Select Column --</option>
                          {fileHeaders.map(h => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground">Official Work Email *</label>
                        <select
                          value={mapping.email}
                          onChange={e => setMapping({ ...mapping, email: e.target.value })}
                          className="w-full bg-card border border-border/80 rounded-xl p-2 text-xs text-foreground"
                        >
                          <option value="">-- Select Column --</option>
                          {fileHeaders.map(h => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Department (Required if auto_split) */}
                      {mode === 'auto_split' && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#23ace3] flex items-center justify-between">
                            <span>Department / Division *</span>
                            <span className="text-[10px] text-muted-foreground">Auto-Grouping</span>
                          </label>
                          <select
                            value={mapping.department}
                            onChange={e => setMapping({ ...mapping, department: e.target.value })}
                            className="w-full bg-card border border-[#23ace3]/60 rounded-xl p-2 text-xs text-foreground"
                          >
                            <option value="">-- Select Column --</option>
                            {fileHeaders.map(h => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Job Title */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground">Designation / Job Title</label>
                        <select
                          value={mapping.jobTitle}
                          onChange={e => setMapping({ ...mapping, jobTitle: e.target.value })}
                          className="w-full bg-card border border-border/80 rounded-xl p-2 text-xs text-foreground"
                        >
                          <option value="">-- Optional --</option>
                          {fileHeaders.map(h => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Reports to Manager */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                          <span>Reporting Manager ID</span>
                          <span className="text-[10px] text-emerald-400">Hierarchy Wire</span>
                        </label>
                        <select
                          value={mapping.managerNumber}
                          onChange={e => setMapping({ ...mapping, managerNumber: e.target.value })}
                          className="w-full bg-card border border-border/80 rounded-xl p-2 text-xs text-foreground"
                        >
                          <option value="">-- Optional --</option>
                          {fileHeaders.map(h => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground">Phone Number</label>
                        <select
                          value={mapping.phone}
                          onChange={e => setMapping({ ...mapping, phone: e.target.value })}
                          className="w-full bg-card border border-border/80 rounded-xl p-2 text-xs text-foreground"
                        >
                          <option value="">-- Optional --</option>
                          {fileHeaders.map(h => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Hire Date */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground">Hire Date / Joined</label>
                        <select
                          value={mapping.hireDate}
                          onChange={e => setMapping({ ...mapping, hireDate: e.target.value })}
                          className="w-full bg-card border border-border/80 rounded-xl p-2 text-xs text-foreground"
                        >
                          <option value="">-- Optional --</option>
                          {fileHeaders.map(h => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===============================================================
                    STEP 4: LIVE PREVIEW & CONFIRMATION
                   =============================================================== */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-foreground">Step 4: Verify Parsed Data</h3>
                        <p className="text-xs text-muted-foreground">
                          Preview the first 5 records as they will be imported into Azure Cosmos DB.
                        </p>
                      </div>

                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                        {rawRows.length} Total Records Ready
                      </Badge>
                    </div>

                    {/* Preview Table */}
                    <div className="rounded-2xl border border-border/80 overflow-hidden bg-card">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-muted/40 border-b border-border/70 text-muted-foreground uppercase text-[10px]">
                            <tr>
                              <th className="p-3">#</th>
                              <th className="p-3">Name</th>
                              <th className="p-3">Employee ID</th>
                              <th className="p-3">Email</th>
                              <th className="p-3">Department</th>
                              <th className="p-3">Title</th>
                              <th className="p-3">Manager</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {rawRows.slice(0, 5).map((row, idx) => {
                              const deptDisplay =
                                mode === 'fixed_department'
                                  ? targetDepartment === 'custom'
                                    ? customNewDepartment
                                    : targetDepartment
                                  : row[mapping.department] || 'Operations'

                              return (
                                <tr key={idx} className="hover:bg-muted/20">
                                  <td className="p-3 font-mono text-[10px] text-muted-foreground">{idx + 1}</td>
                                  <td className="p-3 font-bold text-foreground">{row[mapping.name] || 'N/A'}</td>
                                  <td className="p-3 font-mono text-[#23ace3]">{row[mapping.employeeNumber] || 'N/A'}</td>
                                  <td className="p-3 text-muted-foreground">{row[mapping.email] || 'N/A'}</td>
                                  <td className="p-3">
                                    <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px]">
                                      {deptDisplay}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-muted-foreground">{row[mapping.jobTitle] || 'Staff'}</td>
                                  <td className="p-3 font-mono text-emerald-400">
                                    {row[mapping.managerNumber] || 'None'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 text-[11px] text-muted-foreground space-y-1">
                      <span className="font-bold text-foreground block">System Actions upon Ingestion:</span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Each employee will be created in your organization's isolated database partition.</li>
                        <li>Any new departments detected will be automatically provisioned with 75% staffing thresholds.</li>
                        <li>Default statutory leave allowances (Annual, Casual, Sick) will be initialized automatically.</li>
                        <li>Reporting managers will be resolved and wired for leave approvals.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Controls */}
          {!importResult && (
            <div className="p-4 px-6 border-t border-border/60 bg-muted/20 flex items-center justify-between">
              {step > 1 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep((step - 1) as any)}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl text-xs">
                  Cancel
                </Button>
              )}

              <div className="flex items-center gap-2">
                {step === 1 && (
                  <Button
                    onClick={() => {
                      if (mode === 'fixed_department' && !targetDepartment) {
                        setErrorMsg('Please select a target department before proceeding.')
                        return
                      }
                      setErrorMsg(null)
                      setStep(2)
                    }}
                    className="bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl text-xs font-bold gap-1.5"
                  >
                    <span>Continue to File Upload</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}

                {step === 2 && (
                  <Button
                    disabled={!file || rawRows.length === 0}
                    onClick={() => {
                      if (!file) {
                        setErrorMsg('Please choose a file to proceed.')
                        return
                      }
                      setStep(3)
                    }}
                    className="bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl text-xs font-bold gap-1.5"
                  >
                    <span>Configure Column Mapping</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}

                {step === 3 && (
                  <Button
                    onClick={() => {
                      if (!mapping.name || !mapping.employeeNumber) {
                        setErrorMsg('Full Name and Employee ID columns must be mapped.')
                        return
                      }
                      if (mode === 'auto_split' && !mapping.department) {
                        setErrorMsg('Please select the Department column for auto-split mode.')
                        return
                      }
                      setErrorMsg(null)
                      setStep(4)
                    }}
                    className="bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl text-xs font-bold gap-1.5"
                  >
                    <span>Review & Validate</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}

                {step === 4 && (
                  <Button
                    disabled={isSubmitting}
                    onClick={handleExecuteImport}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-2 px-5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Importing to Database...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4" />
                        <span>Commit {rawRows.length} Employees to Database</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </Dialog>
  )
}
