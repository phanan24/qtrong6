import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sigma, Book, Users, FlaskConical, ArrowLeft, Search, Lightbulb, TriangleAlert, CheckCircle, Dumbbell, X, Send, Bot, MapPin, Clock, DollarSign, Microscope, Cpu, Monitor, Beaker, Zap, Image, Camera } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { HomeworkSubmission, PracticeQuestion, AISettings } from "@shared/schema";
import { LaTeXRenderer } from "@/components/latex-renderer";
import { getActiveAIModel, getAIModelCapabilities } from "@shared/ai-utils";

const getSubjects = (isPaidModel: boolean) => [
  { id: 'math', name: 'Toán học', icon: Sigma, color: 'primary', available: true },
  { id: 'literature', name: 'Ngữ văn', icon: Book, color: 'secondary', available: true },
  { id: 'foreign-language', name: 'Ngoại ngữ', icon: Users, color: 'accent', available: true },
  { id: 'chemistry', name: 'Hoá học', icon: Beaker, color: 'orange-500', available: true },
  { id: 'physics', name: 'Vật lý', icon: Zap, color: 'yellow-500', available: true },
  { id: 'history', name: 'Lịch sử', icon: Clock, color: 'amber-500', available: isPaidModel },
  { id: 'geography', name: 'Địa lý', icon: MapPin, color: 'emerald-500', available: isPaidModel },
  { id: 'economics-law', name: 'GD Kinh tế & Pháp luật', icon: DollarSign, color: 'indigo-500', available: isPaidModel },
  { id: 'biology', name: 'Sinh học', icon: Microscope, color: 'green-500', available: true },
  { id: 'technology', name: 'Công nghệ', icon: Cpu, color: 'purple-500', available: true },
  { id: 'computer-science', name: 'Tin học', icon: Monitor, color: 'blue-500', available: true },
];

type HomeworkStep = 'subjects' | 'input' | 'analysis' | 'practice';

export default function HomeworkPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<HomeworkStep>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [homeworkContent, setHomeworkContent] = useState('');
  const [currentSubmission, setCurrentSubmission] = useState<HomeworkSubmission | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [questionAttempts, setQuestionAttempts] = useState<{ [key: number]: number }>({});
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [readingTimeLeft, setReadingTimeLeft] = useState(0);
  const [isGeneratingNewQuestions, setIsGeneratingNewQuestions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Check AI capabilities
  const { data: currentAISettings } = useQuery({
    queryKey: ["/api/ai-settings"],
  });
  
  const activeModel = getActiveAIModel(currentAISettings as AISettings);
  const aiCapabilities = getAIModelCapabilities(activeModel);
  
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai', content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const { data: aiSettings2 } = useQuery({
    queryKey: ["/api/ai-settings"],
  });

  const subjects = getSubjects(aiCapabilities.hasAdvancedSubjects);

  // Timer for reading time
  useEffect(() => {
    if (readingTimeLeft > 0) {
      const timer = setTimeout(() => {
        setReadingTimeLeft(prev => {
          if (prev <= 1) {
            handleNextQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [readingTimeLeft]);






  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10485760) { // 10MB
        toast({
          title: "File quá lớn",
          description: "Vui lòng chọn file ảnh dưới 10MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedImage(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const analyzeMutation = useMutation({
    mutationFn: async (data: { subject: string; content: string }) => {
      const res = await apiRequest("POST", "/api/homework", data);
      return await res.json();
    },
    onSuccess: (submission) => {
      setCurrentSubmission(submission);
      setCurrentStep('analysis');
      toast({
        title: "Phân tích hoàn thành",
        description: "AI đã hoàn thành phân tích bài làm của bạn.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi phân tích",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const practiceMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const res = await apiRequest("POST", `/api/homework/${submissionId}/practice`);
      return await res.json();
    },
    onSuccess: (questions) => {
      setPracticeQuestions(questions);
      setCurrentQuestionIndex(0);
      setCorrectAnswers(0);
      setQuestionAttempts({});
      setShowCorrectAnswer(false);
      setReadingTimeLeft(0);
      setSelectedAnswer('');
      setIsGeneratingNewQuestions(false);  // Turn off loading
      setCurrentStep('practice');
    },
    onError: (error: any) => {
      setIsGeneratingNewQuestions(false);  // Turn off loading on error
      toast({
        title: "Lỗi tạo bài luyện tập",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubjectSelect = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject?.available) {
      toast({
        title: "Chức năng chưa được cập nhật",
        description: `Môn ${subject?.name} hiện tại chưa khả dụng. Vui lòng chọn môn học khác.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedSubject(subjectId);
    setCurrentStep('input');
  };

  const handleAnalyze = () => {
    if (!homeworkContent.trim()) {
      toast({
        title: "Chưa nhập nội dung",
        description: "Vui lòng nhập nội dung bài làm.",
        variant: "destructive",
      });
      return;
    }

    analyzeMutation.mutate({
      subject: subjects.find(s => s.id === selectedSubject)?.name || selectedSubject,
      content: homeworkContent
    });
  };

  const handleStartPractice = () => {
    if (!currentSubmission) return;
    practiceMutation.mutate(currentSubmission.id);
  };

  const handleAnswerSubmit = () => {
    if (!selectedAnswer) {
      toast({
        title: "Chưa chọn đáp án",
        description: "Vui lòng chọn một đáp án.",
        variant: "destructive",
      });
      return;
    }

    const currentQuestion = practiceQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      // Show correct answer with 1-minute reading time
      setShowCorrectAnswer(true);
      setReadingTimeLeft(60);
    } else {
      // Wrong answer - restart from beginning (reset to question 1)
      toast({
        title: "Sai rồi!",
        description: "Bạn sẽ bắt đầu lại từ câu hỏi đầu tiên.",
        variant: "destructive",
      });
      
      // Reset to first question
      setCorrectAnswers(0);
      setCurrentQuestionIndex(0);
      setSelectedAnswer('');
      setShowCorrectAnswer(false);
      setQuestionAttempts({});
    }
  };

  const handleRestartWithNewQuestions = () => {
    if (!currentSubmission) return;
    // Reset everything and generate new questions
    setCorrectAnswers(0);
    setQuestionAttempts({});
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowCorrectAnswer(false);
    setReadingTimeLeft(0);
    practiceMutation.mutate(currentSubmission.id);
  };

  const handleNextQuestion = () => {
    setShowCorrectAnswer(false);
    setReadingTimeLeft(0);
    setSelectedAnswer('');
    
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Practice completed
      handlePracticeComplete();
    }
  };

  const handleSkipReadingTime = () => {
    setReadingTimeLeft(0);
    handleNextQuestion();
  };

  const handlePracticeComplete = () => {
    const shouldContinue = window.confirm(
      `Chúc mừng! Bạn đã hoàn thành 12 câu hỏi và trả lời đúng ${correctAnswers + 1}/12 câu.\n\nBạn có muốn làm tiếp 12 câu hỏi nữa không?`
    );

    if (shouldContinue) {
      // Generate 12 new questions
      toast({
        title: "Đang tạo 12 câu hỏi mới",
        description: "Vui lòng chờ trong giây lát...",
      });
      
      setIsGeneratingNewQuestions(true);
      setCorrectAnswers(0);
      setCurrentQuestionIndex(0);
      setSelectedAnswer('');
      setShowCorrectAnswer(false);
      setQuestionAttempts({});
      setPracticeQuestions([]);
      
      if (currentSubmission) {
        practiceMutation.mutate(currentSubmission.id);
      }
    } else {
      // Return to analysis tab
      toast({
        title: "Hoàn thành bài luyện tập!",
        description: `Bạn đã trả lời đúng ${correctAnswers + 1}/12 câu. Quay về kiểm tra bài làm.`,
      });
      setCurrentStep('analysis');
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || !currentSubmission) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await apiRequest("POST", `/api/homework/${currentSubmission.id}/chat`, {
        message: userMessage
      });
      const data = await res.json();
      
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        content: data.response || 'Xin lỗi, tôi không thể trả lời câu hỏi này.'
      }]);
      setIsChatLoading(false);
    } catch (error) {
      setIsChatLoading(false);
      toast({
        title: "Lỗi chat",
        description: "Không thể gửi tin nhắn. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const currentSubject = subjects.find(s => s.id === selectedSubject);
  const currentQuestion = practiceQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / practiceQuestions.length) * 100;

  return (
    <div className="space-y-6" data-testid="homework-page">
      <h2 className="text-3xl font-bold text-gray-800" data-testid="text-homework-title">Kiểm tra bài làm</h2>

      {/* Subject Selection */}
      {currentStep === 'subjects' && (
        <div className="grid md:grid-cols-4 gap-4" data-testid="subject-selection">
          {subjects.map((subject) => {
            const Icon = subject.icon;
            return (
              <Card 
                key={subject.id}
                className={`cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary ${
                  !subject.available ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                onClick={() => handleSubjectSelect(subject.id)}
                data-testid={`subject-${subject.id}`}
              >
                <CardContent className="p-6 text-center relative">
                  {!subject.available && (
                    <div className="absolute top-2 right-2">
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Sắp ra mắt
                      </span>
                    </div>
                  )}
                  <div className={`w-16 h-16 bg-${subject.color} bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`text-${subject.color} text-2xl`} />
                  </div>
                  <h3 className="text-lg font-semibold">{subject.name}</h3>
                  {!subject.available && (
                    <p className="text-sm text-gray-500 mt-2">Chức năng sắp được cập nhật</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Homework Input */}
      {currentStep === 'input' && currentSubject && (
        <Card data-testid="homework-input">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                Nhập bài làm - {currentSubject.name}
              </h3>
              <Button 
                variant="ghost" 
                onClick={() => setCurrentStep('subjects')}
                data-testid="button-back-subjects"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="homework-content">Nhập nội dung bài làm</Label>
                <Textarea
                  id="homework-content"
                  rows={8}
                  placeholder="Nhập nội dung bài làm của bạn vào đây..."
                  value={homeworkContent}
                  onChange={(e) => setHomeworkContent(e.target.value)}
                  data-testid="textarea-homework-content"
                />
              </div>

              {aiCapabilities.canUploadImages && (
                <div className="space-y-3">
                  <Label>Ảnh bài làm (tùy chọn)</Label>
                  
                  {selectedImage ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(selectedImage)}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                        data-testid="image-preview"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                        data-testid="button-remove-image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      
                      <div className="mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          disabled={isUploadingImage}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className={`inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer transition-colors ${
                            isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {isUploadingImage ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                              Đang upload...
                            </>
                          ) : (
                            <>
                              <Camera className="mr-2 h-4 w-4" />
                              Upload ảnh lên Imgur
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center" data-testid="image-upload-section">
                      <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">Thêm ảnh bài làm (tùy chọn)</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="homework-image-upload"
                        data-testid="input-image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('homework-image-upload')?.click()}
                        data-testid="button-select-image"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Chọn ảnh
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">JPG, PNG (tối đa 10MB)</p>
                    </div>
                  )}
                </div>
              )}

              <Button 
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending || !homeworkContent.trim()}
                className="w-full"
                data-testid="button-analyze-homework"
              >
                <Search className="mr-2 h-4 w-4" />
                {analyzeMutation.isPending ? "Đang kiểm tra..." : "Kiểm tra bài làm"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Result */}
      {currentStep === 'analysis' && currentSubmission && (
        <div className="space-y-6" data-testid="analysis-result">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Kết quả phân tích</h3>
              
              {/* AI Feedback */}
              <div className="space-y-4">
                {(currentSubmission.analysis as any)?.content && (
                  <Alert data-testid="ai-analysis">
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <LaTeXRenderer content={(currentSubmission.analysis as any).content} />
                    </AlertDescription>
                  </Alert>
                )}

                {currentSubmission.score && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" data-testid="score-display">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="text-blue-500" />
                      <span className="font-semibold text-blue-700">Điểm số: {currentSubmission.score}/10</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat with AI */}
              <div className="mt-6 border-t pt-6" data-testid="ai-chat">
                <h4 className="font-semibold mb-4">Hỏi đáp với AI</h4>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-60 overflow-y-auto">
                  <div className="space-y-3">
                    {chatMessages.length === 0 && (
                      <div className="flex items-start space-x-2" data-testid="ai-initial-message">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <Bot className="text-white text-sm" />
                        </div>
                        <div className="bg-white rounded-lg p-2 shadow-sm">
                          <p className="text-sm">Bạn có cần giải thích thêm về bài làm không?</p>
                        </div>
                      </div>
                    )}
                    
                    {chatMessages.map((message, index) => (
                      <div key={index} className={`flex items-start space-x-2 ${message.role === 'user' ? 'justify-end' : ''}`}>
                        {message.role === 'ai' && (
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <Bot className="text-white text-sm" />
                          </div>
                        )}
                        <div className={`rounded-lg p-2 shadow-sm max-w-xs ${
                          message.role === 'user' 
                            ? 'bg-primary text-white' 
                            : 'bg-white'
                        }`}>
                          {message.role === 'ai' ? (
                            <div className="text-sm">
                              <LaTeXRenderer content={message.content} />
                            </div>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isChatLoading && (
                      <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <Bot className="text-white text-sm" />
                        </div>
                        <div className="bg-white rounded-lg p-2 shadow-sm">
                          <p className="text-sm">Đang suy nghĩ...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Hỏi AI về bài làm..."
                    disabled={isChatLoading}
                    data-testid="input-chat"
                  />
                  <Button 
                    onClick={handleChatSend}
                    disabled={isChatLoading || !chatInput.trim()}
                    data-testid="button-send-chat"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Practice Suggestion */}
              <div className="mt-6 bg-accent bg-opacity-10 border border-accent border-opacity-30 rounded-lg p-4" data-testid="practice-suggestion">
                <div className="flex items-center space-x-2 mb-2">
                  <Dumbbell className="text-accent" />
                  <span className="font-semibold text-accent">Rèn luyện thêm</span>
                </div>
                <p className="mb-4">Bạn có muốn làm thêm 12 câu hỏi tương tự để rèn luyện không?</p>
                <div className="flex space-x-3">
                  <Button 
                    onClick={handleStartPractice}
                    disabled={practiceMutation.isPending}
                    className="bg-accent hover:bg-accent/90"
                    data-testid="button-start-practice"
                  >
                    {practiceMutation.isPending ? "Đang tạo bài..." : "Có, làm bài luyện tập"}
                  </Button>
                  <Button variant="outline" data-testid="button-skip-practice">
                    Không, cảm ơn
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading New Questions */}
      {currentStep === 'practice' && isGeneratingNewQuestions && (
        <Card data-testid="generating-questions">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Đang tạo câu hỏi...</h3>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-4 h-4 bg-primary rounded-full animate-bounce"></div>
                <div className="w-4 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-4 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-gray-600">Đang tạo 12 câu hỏi mới cho bạn. Vui lòng chờ trong giây lát...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Practice Mode */}
      {currentStep === 'practice' && !isGeneratingNewQuestions && practiceQuestions.length > 0 && currentQuestion && (
        <Card data-testid="practice-mode">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold">Chế độ luyện tập</h3>
                <p className="text-gray-600" data-testid="text-practice-progress">
                  Câu {currentQuestionIndex + 1}/{practiceQuestions.length} - Đã đúng: {correctAnswers}/12 câu - 
                  Cấp độ: <span className="capitalize">{currentQuestion.difficulty === 'easy' ? 'Dễ' : currentQuestion.difficulty === 'medium' ? 'Trung bình' : 'Khó'}</span>
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => setCurrentStep('analysis')}
                data-testid="button-exit-practice"
              >
                Thoát luyện tập
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <Progress value={progress} className="h-2" data-testid="progress-practice" />
            </div>

            {/* Show correct answer with reading time */}
            {showCorrectAnswer ? (
              <div className="space-y-6" data-testid="correct-answer-display">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="text-green-500 h-6 w-6" />
                    <h4 className="text-xl font-semibold text-green-700">Chính xác!</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Câu hỏi:</p>
                      <p className="text-gray-600">{currentQuestion.question}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Đáp án đúng:</p>
                      <p className="text-green-600 font-semibold">{currentQuestion.correctAnswer}</p>
                    </div>
                    
                    {currentQuestion.explanation && (
                      <div>
                        <p className="font-medium text-gray-700 mb-2">Giải thích:</p>
                        <div className="text-gray-600">
                          <LaTeXRenderer content={currentQuestion.explanation} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="text-blue-500 h-5 w-5" />
                    <span className="text-blue-700">
                      Thời gian đọc: <span className="font-bold">{readingTimeLeft}s</span>
                    </span>
                  </div>
                  
                  <Button 
                    onClick={handleSkipReadingTime}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    data-testid="button-skip-reading"
                  >
                    Bỏ qua 1 phút
                  </Button>
                </div>
              </div>
            ) : (
              /* Normal question display */
              <div>
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-4" data-testid="text-question">
                    {currentQuestion.question}
                  </h4>
                  
                  <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                    {(currentQuestion.options as string[]).map((option: string, index: number) => {
                      const optionValue = option.split('.')[0];
                      return (
                        <div key={index} className="flex items-center space-x-2" data-testid={`option-${optionValue}`}>
                          <RadioGroupItem value={optionValue} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                            {option}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>

                <Button 
                  onClick={handleAnswerSubmit}
                  disabled={!selectedAnswer}
                  className="w-full"
                  data-testid="button-submit-answer"
                >
                  Xác nhận đáp án
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
