import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CloseIcon,
  InformationCircleIcon,
  BoltIcon,
  WandSparklesIcon,
  ShareIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon
} from './Icons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApiKeyModal?: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onOpenApiKeyModal }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'getting-started' | 'step-by-step' | 'features' | 'troubleshooting'>('getting-started');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const markStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const tabs = [
    { id: 'getting-started', label: t('gettingStarted', 'Getting Started'), icon: InformationCircleIcon },
    { id: 'step-by-step', label: t('stepByStepGuide', 'Step-by-Step Guide'), icon: BoltIcon },
    { id: 'features', label: t('allFeatures', 'All Features'), icon: WandSparklesIcon },
    { id: 'troubleshooting', label: t('troubleshooting', 'Help & Support'), icon: EyeIcon }
  ];

  // Getting Started Section - More compact welcome
  const renderGettingStarted = () => (
    <div className="space-y-4 sm:space-y-5">
      {/* Welcome Message */}
      <div className="text-center bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg p-4 sm:p-5 border border-blue-500/20">
        <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 bg-cyan-400/20 rounded-full flex items-center justify-center">
          <BoltIcon className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400" />
        </div>
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-100 mb-2 sm:mb-3">
          {t('welcomeToDescoWise', 'Welcome to DescoWise!')}
        </h3>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
          {t('elderlyWelcomeDesc', 'This app helps you easily check your electricity bill and usage. We\'ll guide you through everything step by step.')}
        </p>
      </div>

      {/* What You Can Do */}
      <div>
        <h4 className="text-base sm:text-lg font-semibold text-slate-100 mb-3 sm:mb-4">
          {t('whatCanYouDo', 'What can you do with this app?')}
        </h4>
        <div className="grid gap-3 sm:gap-4">
          {[
            {
              icon: ChartBarIcon,
              title: t('checkBillBalance', 'Check Your Bill Balance'),
              desc: t('checkBillBalanceDesc', 'See how much electricity bill you have remaining and when it was last updated'),
              color: 'text-green-400 bg-green-400/10 border-green-400/20'
            },
            {
              icon: WandSparklesIcon,
              title: t('getSmartTips', 'Get Smart Tips'),
              desc: t('getSmartTipsDesc', 'Receive helpful suggestions to save electricity and reduce your monthly bill'),
              color: 'text-purple-400 bg-purple-400/10 border-purple-400/20'
            },
            {
              icon: ShareIcon,
              title: t('shareWithFamily', 'Share with Family'),
              desc: t('shareWithFamilyDesc', 'Let your family members also check the electricity bill from their phones'),
              color: 'text-blue-400 bg-blue-400/10 border-blue-400/20'
            }
          ].map((item, index) => (
            <div key={index} className={`${item.color} border rounded-lg p-3 sm:p-4`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-md ${item.color.split(' ')[1]} flex-shrink-0`}>
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h5 className="text-sm sm:text-base font-semibold text-slate-100 mb-1.5">
                    {item.title}
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ready to Start Button */}
      <div className="text-center">
        <button
          onClick={() => setActiveTab('step-by-step')}
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base transition-colors shadow-md hover:shadow-lg"
        >
          <div className="flex items-center gap-2">
            <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            {t('readyToStart', 'Ready to Start? Click Here!')}
          </div>
        </button>
      </div>
    </div>
  );

  // Step-by-Step Guide - Interactive walkthrough
  const renderStepByStep = () => {
    const steps = [
      {
        id: 'add-account',
        number: 1,
        title: t('stepAddAccount', 'Add Your Electricity Account'),
        description: t('stepAddAccountDesc', 'First, you need to add your DESCO electricity account number to the app.'),
        instructions: [
          t('stepAddInstr1', '1. Look for the "+" (plus) button on the main page'),
          t('stepAddInstr2', '2. Click on it to open the account form'),
          t('stepAddInstr3', '3. Type your electricity account number (found on your bill)'),
          t('stepAddInstr4', '4. Click "Add Account" button')
        ],
        icon: PlusIcon,
        color: 'text-green-400 bg-green-400/10 border-green-400/30'
      },
      {
        id: 'view-dashboard',
        number: 2,
        title: t('stepViewDashboard', 'View Your Electricity Information'),
        description: t('stepViewDashboardDesc', 'Once added, you can see all your electricity information in one place.'),
        instructions: [
          t('stepViewInstr1', '1. Click on your account card to open the dashboard'),
          t('stepViewInstr2', '2. You will see your current bill balance'),
          t('stepViewInstr3', '3. Check your electricity usage patterns'),
          t('stepViewInstr4', '4. View your payment history')
        ],
        icon: ChartBarIcon,
        color: 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      },
      {
        id: 'setup-ai',
        number: 3,
        title: t('stepSetupAI', 'Get Smart Recommendations (Optional)'),
        description: t('stepSetupAIDesc', 'Enable AI features to get personalized tips for saving electricity.'),
        instructions: [
          t('stepAIInstr1', '1. Look for the "AI Key" button at the top'),
          t('stepAIInstr2', '2. Click "Setup API Key" if you want smart tips'),
          t('stepAIInstr3', '3. Follow the simple setup process'),
          t('stepAIInstr4', '4. Start receiving personalized electricity saving tips')
        ],
        icon: WandSparklesIcon,
        color: 'text-purple-400 bg-purple-400/10 border-purple-400/30'
      }
    ];

    return (
      <div className="space-y-4 sm:space-y-5">
        <div className="text-center">
          <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-2">
            {t('stepByStepGuide', 'Step-by-Step Guide')}
          </h3>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {t('followStepsDesc', 'Follow these simple steps to get started. Take your time!')}
          </p>
        </div>

        {steps.map((step) => (
          <div key={step.id} className={`${step.color} border rounded-lg p-3 sm:p-4`}>
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Step Number Circle */}
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${step.color.split(' ')[1]} border ${step.color.split(' ')[2]} flex items-center justify-center flex-shrink-0`}>
                <span className="text-sm sm:text-base font-bold text-slate-100">{step.number}</span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <h4 className="text-sm sm:text-base font-semibold text-slate-100">
                    {step.title}
                  </h4>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3 sm:mb-4">
                  {step.description}
                </p>

                <div className="space-y-1.5 sm:space-y-2">
                  {step.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 flex-shrink-0"></div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {instruction}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 sm:mt-4">
                  <button
                    onClick={() => markStepComplete(step.id)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      completedSteps.has(step.id)
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                    }`}
                  >
                    {completedSteps.has(step.id) ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        {t('completed', 'Completed!')}
                      </div>
                    ) : (
                      t('markComplete', 'Mark as Complete')
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Progress Summary */}
        <div className="bg-slate-700/30 rounded-lg p-3 sm:p-4 text-center">
          <h4 className="text-sm sm:text-base font-medium text-slate-100 mb-2">
            {t('yourProgress', 'Your Progress')}
          </h4>
          <p className="text-xs sm:text-sm text-slate-300">
            {t('completedSteps', 'Completed: {{count}} out of {{total}} steps', {
              count: completedSteps.size,
              total: steps.length
            })}
          </p>
          <div className="w-full bg-slate-600 rounded-full h-2 sm:h-2.5 mt-2 sm:mt-3">
            <div
              className="bg-green-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps.size / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // All Features Section - More compact feature overview
  const renderFeatures = () => (
    <div className="space-y-4 sm:space-y-5">
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-2">
          {t('allFeatures', 'All Features')}
        </h3>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {t('exploreAllFeatures', 'Explore everything this app can do for you')}
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {[
          {
            icon: ChartBarIcon,
            title: t('realTimeData', 'Real-time Bill Information'),
            description: t('realTimeDataElderlyDesc', 'Check your current electricity bill balance, see when it was last updated, and track your usage patterns over time.'),
            features: [
              t('feature1', 'Current bill balance'),
              t('feature2', 'Last update time'),
              t('feature3', 'Usage history'),
              t('feature4', 'Payment tracking')
            ],
            color: 'text-green-400 bg-green-400/10 border-green-400/20'
          },
          {
            icon: WandSparklesIcon,
            title: t('smartRecommendations', 'Smart Electricity Tips'),
            description: t('smartRecommendationsDesc', 'Get personalized suggestions to reduce your electricity bill and use energy more efficiently.'),
            features: [
              t('aiFeature1', 'Personalized saving tips'),
              t('aiFeature2', 'Usage pattern analysis'),
              t('aiFeature3', 'Bill prediction'),
              t('aiFeature4', 'Efficiency recommendations')
            ],
            color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
            requiresSetup: true
          },
          {
            icon: ShareIcon,
            title: t('familySharing', 'Family Sharing'),
            description: t('familySharingDesc', 'Share your electricity information with family members so everyone can stay informed about the bill.'),
            features: [
              t('shareFeature1', 'Share with family'),
              t('shareFeature2', 'Multiple device access'),
              t('shareFeature3', 'Real-time updates'),
              t('shareFeature4', 'Easy link sharing')
            ],
            color: 'text-blue-400 bg-blue-400/10 border-blue-400/20'
          }
        ].map((feature) => (
          <div key={feature.title} className={`${feature.color} border rounded-lg p-3 sm:p-4`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-md ${feature.color.split(' ')[1]} flex-shrink-0`}>
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm sm:text-base font-semibold text-slate-100">
                    {feature.title}
                  </h4>
                  {feature.requiresSetup && (
                    <span className="bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded text-xs font-medium">
                      {t('setupRequired', 'Setup Required')}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                  {feature.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                  {feature.features.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-slate-200">{item}</span>
                    </div>
                  ))}
                </div>

                {feature.requiresSetup && onOpenApiKeyModal && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        onOpenApiKeyModal();
                        onClose();
                      }}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors"
                    >
                      {t('setupNow', 'Setup Now')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Troubleshooting Section - More compact help and support
  const renderTroubleshooting = () => (
    <div className="space-y-4 sm:space-y-5">
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-2">
          {t('troubleshooting', 'Need Help?')}
        </h3>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {t('troubleshootingDesc', 'Common questions and solutions to help you use the app easily')}
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {[
          {
            question: t('accountNotWorking', 'My account number is not working'),
            answer: t('accountNotWorkingAnswer', 'Make sure you\'ve entered the correct account number without any spaces or dashes. The number should be exactly as shown on your DESCO bill. If it still doesn\'t work, the account might be new or there might be a temporary issue with DESCO\'s system.'),
            icon: ExclamationTriangleIcon,
            color: 'text-red-400 bg-red-400/10 border-red-400/20'
          },
          {
            question: t('dataNotUpdating', 'My bill information is not updating'),
            answer: t('dataNotUpdatingAnswer', 'The app gets information directly from DESCO. Sometimes there might be a delay in updates. Try refreshing the page or checking again after a few hours. The app will show you when the information was last updated.'),
            icon: InformationCircleIcon,
            color: 'text-blue-400 bg-blue-400/10 border-blue-400/20'
          },
          {
            question: t('howToPayBill', 'How do I pay my electricity bill?'),
            answer: t('howToPayBillAnswer', 'This app only shows your bill information - it doesn\'t handle payments. To pay your bill, you can use the "Official Portal" button to go to DESCO\'s website, visit a DESCO office, or use mobile banking services like bKash, Nagad, or Rocket.'),
            icon: InformationCircleIcon,
            color: 'text-green-400 bg-green-400/10 border-green-400/20'
          }
        ].map((item, index) => (
          <div key={index} className={`${item.color} border rounded-lg p-3 sm:p-4`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-md ${item.color.split(' ')[1]} flex-shrink-0`}>
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <div className="flex-1">
                <h4 className="text-sm sm:text-base font-semibold text-slate-100 mb-2">
                  {item.question}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Contact Info */}
      <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-lg p-3 sm:p-4">
        <div className="text-center">
          <h4 className="text-sm sm:text-base font-semibold text-red-200 mb-2">
            {t('emergencyContact', 'Emergency Contact')}
          </h4>
          <p className="text-xs sm:text-sm text-red-100 leading-relaxed mb-3">
            {t('emergencyContactDesc', 'For electricity emergencies or urgent issues with your connection:')}
          </p>
          <div className="bg-red-900/30 rounded-md p-2.5 sm:p-3">
            <p className="text-base sm:text-lg font-bold text-red-200">
              {t('descoHotline', 'DESCO: 16120')}
            </p>
            <p className="text-xs sm:text-sm text-red-300 mt-1">
              {t('available24x7', 'Available 24 hours, 7 days a week')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'getting-started': return renderGettingStarted();
      case 'step-by-step': return renderStepByStep();
      case 'features': return renderFeatures();
      case 'troubleshooting': return renderTroubleshooting();
      default: return renderGettingStarted();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header - More compact */}
        <div className="flex items-center justify-between p-3 sm:p-4 lg:p-5 border-b border-slate-700 bg-gradient-to-r from-blue-900/20 to-cyan-900/20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg">
              <InformationCircleIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-400 flex-shrink-0" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-100 truncate">
                {t('helpAndGuidance', 'Help & Guidance')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {t('helpSubtitle', 'We\'re here to help you every step of the way')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-2 sm:p-2.5 rounded-lg hover:bg-slate-700/50 flex-shrink-0"
            aria-label={t('close', 'Close')}
            title={t('closeHelp', 'Close Help')}
          >
            <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Mobile Tab Navigation - More compact */}
        <div className="block lg:hidden border-b border-slate-700 bg-slate-800/50">
          <div className="flex overflow-x-auto scrollbar-hide px-1 sm:px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-3 sm:py-3.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-b-2 min-w-max ${
                    activeTab === tab.id
                      ? 'text-blue-300 border-blue-500 bg-blue-600/20'
                      : 'text-slate-300 border-transparent hover:text-slate-200 hover:border-slate-600 hover:bg-slate-700/30'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar - More compact */}
          <div className="hidden lg:block w-64 border-r border-slate-700 p-3 sm:p-4 overflow-y-auto bg-slate-800/30">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors text-sm font-medium ${
                      activeTab === tab.id
                        ? 'bg-blue-600/30 text-blue-200 border border-blue-500/50'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent hover:border-slate-600/30'
                    }`}
                  >
                    <div className={`p-2 rounded-md ${activeTab === tab.id ? 'bg-blue-500/20' : 'bg-slate-700/50'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Progress indicator for desktop */}
            <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
              <h4 className="text-sm font-medium text-slate-200 mb-2">
                {t('yourProgress', 'Your Progress')}
              </h4>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>{t('completed', 'Completed')}</span>
                  <span>{completedSteps.size}/3</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div
                    className="bg-green-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(completedSteps.size / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Content - More compact */}
          <div className="flex-1 p-3 sm:p-4 lg:p-5 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
