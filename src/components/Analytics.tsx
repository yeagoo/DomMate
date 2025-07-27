import React from 'react';
import { BarChart3, TrendingUp, Globe, Clock } from 'lucide-react';

interface AnalyticsProps {
  language?: 'zh' | 'en';
}

const Analytics: React.FC<AnalyticsProps> = ({ language = 'zh' }) => {
  const t = language === 'en' ? {
    title: 'Analytics Dashboard',
    comingSoon: 'Coming Soon',
    description: 'Comprehensive analytics and reporting features are under development.',
    features: {
      title: 'Planned Features',
      items: [
        'Domain expiry trends analysis',
        'Email notification statistics',
        'System performance metrics',
        'Usage analytics and reports'
      ]
    }
  } : {
    title: '数据分析',
    comingSoon: '即将推出',
    description: '全面的数据分析和报表功能正在开发中。',
    features: {
      title: '计划功能',
      items: [
        '域名到期趋势分析',
        '邮件通知统计',
        '系统性能指标',
        '使用分析和报告'
      ]
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
          <BarChart3 className="h-8 w-8" />
          {t.title}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">{t.comingSoon}</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            {t.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t.features.title}
            </h3>
            <ul className="space-y-2 text-left">
              {t.features.items.map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-700">
                  <Clock className="h-4 w-4 text-blue-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">2.0</div>
              <div className="text-lg font-medium text-gray-700 mb-4">
                {language === 'en' ? 'Version Release' : '版本发布'}
              </div>
              <p className="text-sm text-gray-600">
                {language === 'en' 
                  ? 'Analytics features will be available in the next major release'
                  : '数据分析功能将在下一个主要版本中提供'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 