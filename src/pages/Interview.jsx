import { useEffect, useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  MessageSquare,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Send,
  Loader2,
  ArrowLeft,
  Plus,
  RefreshCw,
  FileText,
  User,
  GraduationCap,
  Calendar,
  Building,
  Target,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  CameraOff
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useResumesList, useResume } from "@/hooks/useResumes";
import { interviewApi } from "@/api/interview";
import { relativeTime } from "@/lib/utils";

function FieldLabel({ children }) {
  return (
    <label className="text-xs font-semibold text-[var(--ink-muted)] mb-1.5 block">
      {children}
    </label>
  );
}

export default function Interview() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("new");
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [viewReport, setViewReport] = useState(false);

  // Queries
  const resumesQuery = useResumesList();
  const historyQuery = useQuery({
    queryKey: ["interview", "history"],
    queryFn: () => interviewApi.getHistory().then((d) => d.history),
  });

  const sessionQuery = useQuery({
    queryKey: ["interview", "session", activeSessionId],
    queryFn: () => interviewApi.getDetails(activeSessionId).then((d) => d.interview),
    enabled: !!activeSessionId,
  });

  // Mutators
  const startMutation = useMutation({
    mutationFn: (payload) => interviewApi.start(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["interview", "history"] });
      setActiveSessionId(data.interview._id);
    },
  });

  const answerMutation = useMutation({
    mutationFn: ({ id, answer }) => interviewApi.submitAnswer(id, answer),
    onSuccess: (data) => {
      qc.setQueryData(["interview", "session", activeSessionId], data.interview);
      qc.invalidateQueries({ queryKey: ["interview", "history"] });
    },
  });

  const finishMutation = useMutation({
    mutationFn: (id) => interviewApi.finishEarly(id),
    onSuccess: (data) => {
      qc.setQueryData(["interview", "session", activeSessionId], data.interview);
      qc.invalidateQueries({ queryKey: ["interview", "history"] });
    },
  });

  const session = sessionQuery.data;

  // Handle active session changes or loading a past session
  const selectSession = (id) => {
    setActiveSessionId(id);
    setTab("new");
  };

  const handleBackToForm = () => {
    setActiveSessionId(null);
    setInCall(false);
    setViewReport(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Mock Interview"
        description="Conduct tailored interview simulations and receive performance feedback based on your resume."
      />

      {!activeSessionId ? (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="new">
              <Plus size={14} className="mr-1.5" /> New Interview
            </TabsTrigger>
            <TabsTrigger value="history">
              <MessageSquare size={14} className="mr-1.5" /> Interview History
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="new">
              <NewInterviewForm
                resumes={resumesQuery.data || []}
                isLoadingResumes={resumesQuery.isLoading}
                onStart={(payload) => startMutation.mutate(payload)}
                isStarting={startMutation.isPending}
                error={startMutation.error?.message}
              />
            </TabsContent>
            <TabsContent value="history">
              <InterviewHistoryList
                history={historyQuery.data || []}
                isLoading={historyQuery.isLoading}
                onSelect={selectSession}
                onRefresh={() => historyQuery.refetch()}
              />
            </TabsContent>
          </div>
        </Tabs>
      ) : (
        <div className="space-y-6">
          {sessionQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-1/4 rounded-2xl" />
              <Skeleton className="h-[400px] rounded-3xl" />
            </div>
          ) : sessionQuery.error ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load interview session"
              description={sessionQuery.error.message}
              action={
                <Button variant="outline" onClick={handleBackToForm}>
                  Go Back
                </Button>
              }
            />
          ) : session ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Button variant="ghost" size="sm" onClick={handleBackToForm}>
                  <ArrowLeft size={14} className="mr-1" /> Exit Session
                </Button>
                <div className="h-4 w-px bg-[var(--border)]" />
                <span className="text-xs text-[var(--ink-muted)]">
                  {session.company ? (
                    <>
                      Session with <span className="font-semibold text-[var(--ink)]">{session.company}</span> · {session.role}
                    </>
                  ) : (
                    <>
                      General Mock Interview · <span className="font-semibold text-[var(--ink)]">{session.role}</span>
                    </>
                  )}
                </span>
                <Badge tone={session.status === "completed" ? "success" : "accent"} className="ml-auto">
                  {session.status}
                </Badge>
              </div>

              {session.status === "active" ? (
                <ActiveInterviewChat
                  session={session}
                  onSubmitAnswer={(ans) => answerMutation.mutate({ id: session._id, answer: ans })}
                  isSubmitting={answerMutation.isPending}
                  onFinishEarly={() => finishMutation.mutate(session._id)}
                  isFinishing={finishMutation.isPending}
                  error={answerMutation.error?.message || finishMutation.error?.message}
                />
              ) : (
                !viewReport ? (
                  <ActiveInterviewChat
                    session={session}
                    onSubmitAnswer={() => {}}
                    isSubmitting={false}
                    onFinishEarly={() => {}}
                    isFinishing={false}
                    onViewReport={() => setViewReport(true)}
                  />
                ) : (
                  <InterviewFeedbackReport session={session} />
                )
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// 1. Form component
function NewInterviewForm({ resumes, isLoadingResumes, onStart, isStarting, error }) {
  const [resumeId, setResumeId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");

  const { data: resumeDetail, isLoading: isLoadingDetail } = useResume(resumeId);
  const versions = useMemo(() => resumeDetail?.versions || [], [resumeDetail]);

  useEffect(() => {
    if (versions.length > 0) {
      // Auto-select latest version
      setVersionId(versions[versions.length - 1]._id);
    } else {
      setVersionId("");
    }
  }, [versions]);

  const canStart = resumeId && versionId && role.trim() && !isStarting;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canStart) return;
    onStart({
      resumeId,
      resumeVersionId: versionId,
      company: company.trim() || undefined,
      role: role.trim(),
      jd: jd.trim() || undefined,
    });
  };

  if (isLoadingResumes) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <div className="space-y-4 p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </Card>
    );
  }

  if (resumes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No resumes found"
        description="You need to upload at least one resume first before conducting a mock interview."
      />
    );
  }

  return (
    <Card padding="lg" className="max-w-2xl">
      <CardHeader>
        <div>
          <CardTitle className="text-base">Setup Interview Simulation</CardTitle>
          <CardDescription className="mt-1">
            Choose your resume and fill in target details. Our AI will analyze them to ask realistic interview questions.
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Select Resume</FieldLabel>
            <select
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              <option value="">-- Choose Resume --</option>
              {resumes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel>Resume Version</FieldLabel>
            <select
              value={versionId}
              onChange={(e) => setVersionId(e.target.value)}
              disabled={!resumeId || isLoadingDetail || versions.length === 0}
              className="w-full h-10 px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
            >
              {isLoadingDetail ? (
                <option>Loading versions...</option>
              ) : versions.length === 0 ? (
                <option value="">Select a resume first</option>
              ) : (
                versions.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.label} ({v.sourceType})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Target Company (Optional)</FieldLabel>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google, Stripe, or leave blank"
              maxLength={100}
            />
          </div>

          <div>
            <FieldLabel>Target Role</FieldLabel>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer, Product Manager"
              maxLength={100}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Job Description (Optional)</FieldLabel>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job description or role requirements here to get highly customized questions..."
            rows={5}
            className="w-full p-3 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] placeholder:text-[var(--ink-muted)] resize-y min-h-[120px]"
          />
        </div>

        {error && (
          <div className="text-xs text-[var(--danger)] bg-[#F8E3E0] rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="accent" disabled={!canStart}>
            {isStarting ? (
              <>
                <Loader2 size={14} className="animate-spin mr-1.5" /> Initializing Session...
              </>
            ) : (
              <>
                <Sparkles size={14} className="mr-1.5" /> Start Simulation
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// 2. Chat component
function ActiveInterviewChat({ session, onSubmitAnswer, isSubmitting, onFinishEarly, isFinishing, onViewReport, error }) {
  const [answer, setAnswer] = useState("");
  const scrollRef = useRef(null);

  // Speech Recognition (Dictation)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const [hasStartedCall, setHasStartedCall] = useState(false);
  const [readAloud, setReadAloud] = useState(() => localStorage.getItem("interview_read_aloud") !== "false");
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const lastSpokenIndexRef = useRef(-1);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle call start (autoplay bypass)
  const handleStartCall = () => {
    setHasStartedCall(true);
    if (readAloud && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const firstMsg = session.messages.find((m) => m.role === "agent");
      if (firstMsg) {
        const utterance = new SpeechSynthesisUtterance(firstMsg.content);
        utterance.rate = 0.95;

        const doSpeak = () => {
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(
            (v) =>
              v.lang.startsWith("en") &&
              (v.name.includes("Male") ||
                v.name.includes("David") ||
                v.name.includes("Alex") ||
                v.name.includes("Google US English") ||
                v.name.includes("Google UK English"))
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
          utterance.onstart = () => setIsAgentSpeaking(true);
          utterance.onend = () => setIsAgentSpeaking(false);
          utterance.onerror = () => setIsAgentSpeaking(false);
          window.speechSynthesis.speak(utterance);
        };

        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          window.speechSynthesis.onvoiceschanged = () => {
            doSpeak();
            window.speechSynthesis.onvoiceschanged = null;
          };
        } else {
          doSpeak();
        }
      }
    }
  };

  // Monitor messages to read them aloud (mute if user is speaking)
  useEffect(() => {
    if (!readAloud || isListening || !hasStartedCall) {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsAgentSpeaking(false);
      return;
    }
    const messages = session.messages;
    const lastIndex = messages.length - 1;
    // Don't repeat speak for the first question if we already handled it in handleStartCall
    if (lastIndex === 0) {
      lastSpokenIndexRef.current = 0;
      return;
    }
    if (
      lastIndex >= 0 &&
      messages[lastIndex].role === "agent" &&
      lastSpokenIndexRef.current < lastIndex
    ) {
      lastSpokenIndexRef.current = lastIndex;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(messages[lastIndex].content);
        utterance.rate = 0.95;

        const doSpeak = () => {
          // Try to select a natural English voice for Alex (male/neutral preferred)
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(
            (v) =>
              v.lang.startsWith("en") &&
              (v.name.includes("Male") ||
                v.name.includes("David") ||
                v.name.includes("Alex") ||
                v.name.includes("Google US English") ||
                v.name.includes("Google UK English"))
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }

          utterance.onstart = () => setIsAgentSpeaking(true);
          utterance.onend = () => setIsAgentSpeaking(false);
          utterance.onerror = () => setIsAgentSpeaking(false);
          window.speechSynthesis.speak(utterance);
        };

        // Chrome loads voices asynchronously
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          window.speechSynthesis.onvoiceschanged = () => {
            doSpeak();
            window.speechSynthesis.onvoiceschanged = null; // Clean up
          };
        } else {
          doSpeak();
        }
      }
    }
  }, [session.messages, readAloud, isListening, hasStartedCall]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAnswer((prev) => (prev ? prev + " " + transcript : transcript));
      };
      rec.onerror = () => setIsListening(false);

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const agentQuestions = useMemo(() => {
    return session.messages.filter((m) => m.role === "agent");
  }, [session.messages]);

  const progress = Math.min(agentQuestions.length, 5);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, isSubmitting]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting) return;
    onSubmitAnswer(answer.trim());
    setAnswer("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Video feeds column */}
      <div className="lg:col-span-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <AlexFeed isSpeaking={isAgentSpeaking} currentMessage={agentQuestions[agentQuestions.length - 1]?.content} />
          <CandidateCamera />
        </div>
      </div>

      {/* Chat Thread Panel */}
      <div className="lg:col-span-7">
        <Card padding="none" className="relative overflow-hidden flex flex-col h-[560px] md:h-[640px] border-[var(--border)]">
          {/* Blur Overlay for Autoplay Bypass */}
          {!hasStartedCall && session.status === "active" && (
            <div className="absolute inset-0 bg-white/80 dark:bg-[rgba(10,10,12,0.92)] backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
              <div className="h-14 w-14 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] flex items-center justify-center mb-4 border border-[var(--border)] animate-pulse">
                <Volume2 size={24} />
              </div>
              <div className="text-base font-semibold text-[var(--ink)] mb-1.5 font-display">Alex is ready to begin</div>
              <p className="text-xs text-[var(--ink-muted)] mb-5 max-w-xs leading-relaxed">
                Click below to connect the audio feed and start the interview session.
              </p>
              <Button onClick={handleStartCall} variant="accent" size="lg" className="rounded-xl px-6 h-11 font-semibold shadow-md flex items-center justify-center gap-2">
                Start Call with Alex
              </Button>
            </div>
          )}

          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--ink)]">Interview Panel</div>
              <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                Answer the interviewer's questions. Simulation goes up to 5 questions.
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
                onClick={() => {
                  setReadAloud((v) => {
                    const next = !v;
                    localStorage.setItem("interview_read_aloud", String(next));
                    return next;
                  });
                }}
              >
                {readAloud ? (
                  <>
                    <Volume2 size={14} className="text-[var(--accent-strong)]" /> Voice: On
                  </>
                ) : (
                  <>
                    <VolumeX size={14} /> Voice: Off
                  </>
                )}
              </Button>
              <div className="h-4 w-px bg-[var(--border)]" />
              <div className="text-xs tabular text-[var(--ink-muted)]">
                Question <span className="font-semibold text-[var(--ink)]">{progress}</span> of 5
              </div>
              {session.status !== "completed" && (
                <Button variant="outline" size="sm" onClick={onFinishEarly} disabled={isFinishing || isSubmitting}>
                  {isFinishing ? "Finishing..." : "Finish Early"}
                </Button>
              )}
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {session.messages.map((msg, i) => {
              const isAgent = msg.role === "agent";
              return (
                <div
                  key={i}
                  className={`flex ${isAgent ? "justify-start" : "justify-end"} items-start gap-2`}
                >
                  {isAgent && (
                    <div className="h-8 w-8 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold font-display border border-[var(--border)] select-none">
                      A
                    </div>
                  )}
                  <div className="flex flex-col max-w-[80%]">
                    {isAgent && (
                      <span className="text-[10px] text-[var(--ink-muted)] mb-0.5 font-semibold pl-1 select-none">Alex</span>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isAgent
                          ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                          : "bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--border)]"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            {isSubmitting && (
              <div className="flex justify-start items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold font-display border border-[var(--border)] select-none">
                  A
                </div>
                <div className="flex flex-col max-w-[80%]">
                  <span className="text-[10px] text-[var(--ink-muted)] mb-0.5 font-semibold pl-1 select-none">Alex</span>
                  <div className="rounded-2xl px-4 py-3 text-sm text-[var(--ink-muted)] bg-[var(--surface-2)] border border-[var(--border)] animate-pulse">
                    Alex is typing...
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {error && (
            <div className="mx-6 my-2 p-3 bg-[var(--danger-soft)] border border-[var(--danger)] border-opacity-20 rounded-xl flex items-center gap-2 text-xs text-[var(--danger)] shrink-0">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Input Form or View Report Button */}
          {session.status === "completed" ? (
            <div className="p-6 border-t border-[var(--border)] bg-[var(--surface-2)] flex flex-col items-center gap-3">
              <div className="text-xs text-[var(--ink-muted)] text-center font-medium">
                Alex has concluded the interview session.
              </div>
              <Button
                type="button"
                variant="accent"
                size="lg"
                onClick={onViewReport}
                className="flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-semibold shadow-md shrink-0 animate-bounce"
              >
                <Sparkles size={16} /> View Performance Report & Feedback
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center gap-2">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={isListening ? "Listening... Speak your answer now." : "Type or speak your response here..."}
                disabled={isSubmitting}
                rows={2}
                className="flex-1 p-3 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={toggleListening}
                disabled={isSubmitting}
                className={`h-12 w-12 rounded-xl flex items-center justify-center p-0 shrink-0 ${
                  isListening ? "border-[var(--danger)] bg-[#F8E3E0] text-[var(--danger)] animate-pulse" : ""
                }`}
                title={isListening ? "Listening... Click to stop" : "Speak your answer"}
              >
                {isListening ? <Mic size={16} /> : <MicOff size={16} />}
              </Button>
              <Button type="submit" variant="accent" size="lg" disabled={!answer.trim() || isSubmitting} className="h-12 w-12 rounded-xl flex items-center justify-center p-0 shrink-0">
                <Send size={16} />
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

// 3. Feedback Report component
function InterviewFeedbackReport({ session }) {
  const f = session.feedback || {};
  const score = f.overallScore || 0;

  const scoreColor = useMemo(() => {
    if (score >= 85) return "text-[var(--success)]";
    if (score >= 70) return "text-[var(--accent-strong)]";
    if (score >= 50) return "text-[var(--warning)]";
    return "text-[var(--danger)]";
  }, [score]);

  return (
    <div className="space-y-6">
      {/* Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Score Card */}
        <Card className="md:col-span-4 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-xs uppercase tracking-wider text-[var(--ink-muted)] font-semibold mb-2">
            Overall Score
          </div>
          <div className={`font-display text-7xl font-bold tracking-tight ${scoreColor}`}>
            {score}
          </div>
          <div className="text-xs text-[var(--ink-muted)] mt-2">
            out of 100 points
          </div>
        </Card>

        {/* Verdict Summary */}
        <Card className="md:col-span-8 p-6 flex flex-col justify-center">
          <CardTitle className="text-base mb-2">Performance Verdict</CardTitle>
          <p className="text-sm text-[var(--ink)] leading-relaxed">
            {f.summary || "No summary provided."}
          </p>
        </Card>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card padding="lg">
          <CardTitle className="text-base text-[var(--success)] flex items-center gap-2 mb-3">
            <CheckCircle size={16} /> Standout Strengths
          </CardTitle>
          <ul className="space-y-2 text-sm text-[var(--ink)]">
            {(f.strengths || []).map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--success)] font-bold shrink-0 mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
            {(!f.strengths || f.strengths.length === 0) && (
              <li className="text-[var(--ink-muted)] italic">No strengths identified.</li>
            )}
          </ul>
        </Card>

        <Card padding="lg">
          <CardTitle className="text-base text-[var(--warning)] flex items-center gap-2 mb-3">
            <AlertCircle size={16} /> Key Improvements
          </CardTitle>
          <ul className="space-y-2 text-sm text-[var(--ink)]">
            {(f.improvements || []).map((imp, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--warning)] font-bold shrink-0 mt-0.5">•</span>
                <span>{imp}</span>
              </li>
            ))}
            {(!f.improvements || f.improvements.length === 0) && (
              <li className="text-[var(--ink-muted)] italic">No areas of improvement identified.</li>
            )}
          </ul>
        </Card>
      </div>

      {/* Question critique section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question Breakdown & Evaluation</CardTitle>
          <CardDescription>
            Review every response you provided during this interview along with ideal answers.
          </CardDescription>
        </CardHeader>
        <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
          {(f.sampleAnswers || []).map((sa, i) => {
            const tone =
              sa.rating === "Good"
                ? "success"
                : sa.rating === "Satisfactory"
                ? "warning"
                : "danger";

            return (
              <div key={i} className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-sm text-[var(--ink)] flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    Question
                    <SpeakButton text={sa.question} />
                  </div>
                  <Badge tone={tone}>{sa.rating}</Badge>
                </div>

                <p className="text-sm font-medium text-[var(--ink-muted)] italic pl-8">
                  &ldquo;{sa.question}&rdquo;
                </p>

                {/* Critique */}
                <div className="pl-8 space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1 flex items-center justify-between">
                      <span>Feedback</span>
                      <SpeakButton text={sa.feedback} />
                    </div>
                    <p className="text-sm text-[var(--ink)] leading-relaxed">
                      {sa.feedback}
                    </p>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1 flex items-center justify-between">
                      <span>Ideal Sample Response</span>
                      <SpeakButton text={sa.sampleAnswer} />
                    </div>
                    <div className="text-sm bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)] text-[var(--ink)] leading-relaxed font-sans">
                      {sa.sampleAnswer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function SpeakButton({ text }) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 px-1.5 flex items-center gap-1 text-[10px] font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] rounded-md"
      onClick={handleSpeak}
      title={speaking ? "Stop" : "Listen"}
    >
      {speaking ? (
        <>
          <VolumeX size={10} className="text-[var(--danger)]" /> Stop
        </>
      ) : (
        <>
          <Volume2 size={10} /> Listen
        </>
      )}
    </Button>
  );
}

// 4. History List component
function InterviewHistoryList({ history, isLoading, onSelect, onRefresh }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No interviews found"
        description="Conduct a mock interview session to view your history here."
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div>
          <CardTitle className="text-base">Past Sessions</CardTitle>
          <CardDescription>
            Click on any past session to review its detailed performance evaluation.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
      </CardHeader>
      <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
        {history.map((h) => (
          <div
            key={h._id}
            onClick={() => onSelect(h._id)}
            className="p-4 flex items-center justify-between hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          >
            <div className="space-y-1">
              <div className="text-sm font-semibold text-[var(--ink)]">
                {h.company ? `${h.company} — ` : ""}
                <span className={h.company ? "font-normal text-[var(--ink-muted)]" : ""}>{h.role}</span>
                {!h.company && <span className="text-xs font-normal text-[var(--ink-muted)] ml-1">(General)</span>}
              </div>
              <div className="text-[11px] text-[var(--ink-muted)]">
                {relativeTime(h.createdAt)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {h.status === "completed" && h.feedback?.overallScore != null && (
                <div className="text-right">
                  <div className="text-xs font-semibold text-[var(--ink-muted)]">Score</div>
                  <div className="text-sm font-bold text-[var(--accent-strong)]">
                    {h.feedback.overallScore}
                  </div>
                </div>
              )}
              <Badge tone={h.status === "completed" ? "success" : "accent"}>
                {h.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AlexFeed({ isSpeaking, currentMessage }) {
  return (
    <div className="relative aspect-video md:aspect-[4/3] w-full bg-[var(--accent-soft)] rounded-2xl overflow-hidden border border-[var(--border)] flex flex-col items-center justify-center p-4">
      {/* Waveform / Pulsing Ring */}
      <div className="relative flex items-center justify-center h-20 w-20">
        <div
          className={`absolute inset-0 rounded-full bg-[var(--accent-strong)] opacity-20 transition-all duration-300 ${
            isSpeaking ? "animate-ping scale-150" : "scale-100"
          }`}
        />
        <div
          className={`h-16 w-16 rounded-full bg-[var(--accent-strong)] text-white flex items-center justify-center text-xl font-bold tracking-wider transition-all duration-500 shadow-md ${
            isSpeaking ? "scale-105 ring-4 ring-[var(--accent)]" : ""
          }`}
        >
          A
        </div>
      </div>

      <div className="mt-3 text-center">
        <div className="text-sm font-semibold text-[var(--accent-strong)]">Alex</div>
        <div className="text-[10px] text-[var(--ink-muted)] mt-0.5 font-medium">AI Interviewer</div>
      </div>

      {/* Subtitles Overlay */}
      {currentMessage && (
        <div className="absolute bottom-3 inset-x-4 bg-black/75 backdrop-blur-md text-white text-[11px] p-2.5 rounded-xl text-center leading-relaxed max-h-16 overflow-y-auto border border-white/10 select-none">
          {currentMessage}
        </div>
      )}
    </div>
  );
}

function CandidateCamera() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activeStream = null;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((s) => {
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        setError("Camera permission denied or unavailable.");
      });

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative aspect-video md:aspect-[4/3] w-full bg-[var(--surface-2)] rounded-2xl overflow-hidden border border-[var(--border)] shadow-inner flex items-center justify-center">
      {error ? (
        <div className="text-xs text-[var(--ink-muted)] p-4 text-center">
          <CameraOff size={24} className="mx-auto mb-2 text-[var(--danger)] text-opacity-80" />
          {error}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1.5 font-medium select-none">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            Candidate (Live)
          </div>
        </>
      )}
    </div>
  );
}


