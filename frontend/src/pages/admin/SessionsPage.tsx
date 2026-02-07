import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, SessionDetails, ExamDetails } from '@/lib/adminApi';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ExamReportTable } from '@/components/admin/ExamReportTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  User,
  XCircle,
  Filter,
  X,
  List,
  Table2,
} from 'lucide-react';

export function SessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionDetails[]>([]);
  const [exams, setExams] = useState<ExamDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'list' | 'report'>('list');

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    loadSessions();
  }, [filter, selectedExamId, startDate, endDate]);

  const loadExams = async () => {
    try {
      const response = await adminApi.getExams();
      setExams(response.data.data.exams);
    } catch (err) {
      console.error('Failed to load exams:', err);
    }
  };

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const params: any = {};

      if (filter !== 'all') {
        params.status = filter;
      }

      if (selectedExamId && selectedExamId !== 'all') {
        params.examId = selectedExamId;
      }

      if (startDate) {
        params.startDate = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
      }

      const response = await adminApi.getSessions(params);
      setSessions(response.data.data.sessions);
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setFilter('all');
    setSelectedExamId('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = filter !== 'all' || (selectedExamId && selectedExamId !== 'all') || startDate || endDate;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20">
            <Activity className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'terminated':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Terminated
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Session Monitoring</h1>
          <p className="text-muted-foreground">Monitor all exam sessions and proctoring activity</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <CardTitle>Filters</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Filter */}
            <div>
              <Label className="mb-2">Status</Label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setFilter('all')}
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                >
                  All Sessions
                </Button>
                <Button
                  onClick={() => setFilter('in_progress')}
                  variant={filter === 'in_progress' ? 'default' : 'outline'}
                  size="sm"
                >
                  In Progress
                </Button>
                <Button
                  onClick={() => setFilter('completed')}
                  variant={filter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                >
                  Completed
                </Button>
              </div>
            </div>

            {/* Exam and Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Exam Filter */}
              <div className="space-y-2">
                <Label htmlFor="exam-filter">Exam Name</Label>
                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                  <SelectTrigger id="exam-filter">
                    <SelectValue placeholder="All Exams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.title} ({exam.version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date Filter */}
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* End Date Filter */}
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="pt-4 border-t border-border">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {filter !== 'all' && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Status: {filter.replace('_', ' ')}
                    </Badge>
                  )}
                  {selectedExamId && selectedExamId !== 'all' && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Exam: {exams.find((e) => e.id === selectedExamId)?.title || 'Unknown'}
                    </Badge>
                  )}
                  {startDate && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      From: {new Date(startDate).toLocaleDateString()}
                    </Badge>
                  )}
                  {endDate && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      To: {new Date(endDate).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs - Show when exam is selected */}
        {selectedExamId && selectedExamId !== 'all' && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'report')} className="mb-6">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                Session List
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center gap-2">
                <Table2 className="w-4 h-4" />
                Exam Report
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Conditional Content Based on Active Tab */}
        {selectedExamId && selectedExamId !== 'all' ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'report')}>
            <TabsContent value="report">
              <ExamReportTable examId={selectedExamId} />
            </TabsContent>
            <TabsContent value="list">
              <div className="space-y-4">
                {sessions.map((session) => (
                  <Card
                    key={session.id}
                    onClick={() => navigate(`/admin/sessions/${session.id}`)}
                    className="hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Session Info */}
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-foreground mb-1">{session.examTitle}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="w-4 h-4" />
                                <span>{session.studentName}</span>
                              </div>
                            </div>
                            {getStatusBadge(session.status)}
                          </div>

                          {/* Stats */}
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                Started: {new Date(session.startTime).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              <span className={session.totalViolations > 3 ? 'text-orange-600 font-medium' : ''}>
                                {session.totalViolations} violations
                              </span>
                            </div>
                            {session.score !== undefined && session.score !== null && (
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                <span>Score: {session.score}%</span>
                              </div>
                            )}
                          </div>

                          {/* Progress */}
                          {session.status === 'in_progress' && (
                            <div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>Progress</span>
                                <span>{session.completionPercentage}%</span>
                              </div>
                              <div className="progress-bar h-2">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${session.completionPercentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Additional Info Card */}
                        <div className="lg:w-48 bg-muted rounded-lg p-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Session ID:</span>
                            <span className="font-mono text-xs text-foreground">{session.sessionId.slice(0, 12)}...</span>
                          </div>
                          {session.wasResumed && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Resumed:</span>
                              <span className="font-medium text-orange-600">{session.resumeCount}x</span>
                            </div>
                          )}
                          {session.submissionType && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Submitted:</span>
                              <span className="text-foreground capitalize">{session.submissionType.replace('_', ' ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {sessions.length === 0 && !error && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No sessions found</h3>
                      <p className="text-muted-foreground">
                        {filter === 'all'
                          ? 'No exam sessions have been started yet'
                          : `No ${filter.replace('_', ' ')} sessions`}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Summary */}
                {sessions.length > 0 && (
                  <div className="mt-6 text-sm text-muted-foreground">
                    Showing <strong className="text-foreground">{sessions.length}</strong> session{sessions.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          /* Sessions List - No Exam Selected */
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card
                key={session.id}
                onClick={() => navigate(`/admin/sessions/${session.id}`)}
                className="hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Session Info */}
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-foreground mb-1">{session.examTitle}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>{session.studentName}</span>
                          </div>
                        </div>
                        {getStatusBadge(session.status)}
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            Started: {new Date(session.startTime).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span className={session.totalViolations > 3 ? 'text-orange-600 font-medium' : ''}>
                            {session.totalViolations} violations
                          </span>
                        </div>
                        {session.score !== undefined && session.score !== null && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>Score: {session.score}%</span>
                          </div>
                        )}
                      </div>

                      {/* Progress */}
                      {session.status === 'in_progress' && (
                        <div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{session.completionPercentage}%</span>
                          </div>
                          <div className="progress-bar h-2">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${session.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Additional Info Card */}
                    <div className="lg:w-48 bg-muted rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Session ID:</span>
                        <span className="font-mono text-xs text-foreground">{session.sessionId.slice(0, 12)}...</span>
                      </div>
                      {session.wasResumed && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Resumed:</span>
                          <span className="font-medium text-orange-600">{session.resumeCount}x</span>
                        </div>
                      )}
                      {session.submissionType && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Submitted:</span>
                          <span className="text-foreground capitalize">{session.submissionType.replace('_', ' ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {sessions.length === 0 && !error && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No sessions found</h3>
                  <p className="text-muted-foreground">
                    {filter === 'all'
                      ? 'No exam sessions have been started yet'
                      : `No ${filter.replace('_', ' ')} sessions`}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            {sessions.length > 0 && (
              <div className="mt-6 text-sm text-muted-foreground">
                Showing <strong className="text-foreground">{sessions.length}</strong> session{sessions.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
