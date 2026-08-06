/**
 * 页面示例：证书专栏 · ScrollStack 使用示例
 * -----------------------------------------
 * 两种集成方式：
 *   1) 局部容器滚动（useWindowScroll=false）——默认，推荐用于嵌入在 section 中
 *   2) 整页滚动（useWindowScroll=true）——用于独立的证书页面
 */
import CertStackSection from '../components/CertStackSection/CertStackSection';

const CERTIFICATIONS = [
  {
    id: 'aliyun-aca-cloud',
    name: 'ACA 云计算助理工程师 · Alibaba Cloud',
    tag: '阿里云 · 基础',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E9%98%BF%E9%87%8C%E4%BA%91ACA%E4%BA%91%E8%AE%A1%E7%AE%97%E5%8A%A9%E7%90%86%E5%B7%A5%E7%A8%8B%E5%B8%88%E8%AE%A4%E8%AF%81%E8%AF%81%E4%B9%A6%2C%E8%93%9D%E7%99%BD%E8%89%B2%E5%95%86%E5%8A%A1%E9%A3%8E%E6%A0%BC%2C%E4%B8%AD%E9%97%B4%E5%B7%A8%E5%A4%A7ACA%E8%89%BA%E6%9C%AF%E5%AD%97%2C%E9%98%BF%E9%87%8C%E4%BA%91Logo%E5%8F%B3%E4%B8%8A%E8%A7%92%2C%E6%89%81%E5%B9%B3%E6%AF%9416%E6%AF%949%2C%E8%AE%BE%E8%AE%A1%E5%B8%88%E7%BA%A7%E5%88%AB%E5%8D%B0%E5%88%B7%E7%99%BD%E8%BE%B9%E6%A1%86%E5%92%8C%E5%BE%AE%E7%AB%A0&image_size=landscape_4_3',
    href: '#'
  },
  {
    id: 'aliyun-aca-bigdata',
    name: 'ACA 大数据助理工程师 · MaxCompute & DataWorks',
    tag: '阿里云 · 数据',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E9%98%BF%E9%87%8C%E4%BA%91ACA%E5%A4%A7%E6%95%B0%E6%8D%AE%E5%8A%A9%E7%90%86%E5%B7%A5%E7%A8%8B%E5%B8%88%E8%AF%81%E4%B9%A6%2C%E6%B7%B1%E7%BA%A2%E7%B4%AB%E4%B8%8E%E9%87%91%E8%89%B2%E6%95%B0%E6%8D%AE%E8%8A%B1%E7%BA%B9%E8%83%8C%E6%99%AF%2C%E6%95%B0%E6%8D%AE%E5%8F%AF%E8%A7%86%E5%8C%96%E5%9B%BE%E6%A0%87%E4%B8%8E%E6%95%B0%E6%8D%AE%E4%BB%93%E5%BA%93%E5%85%83%E7%B4%A0%2C%E6%9E%81%E7%AE%80%E5%95%86%E5%8A%A1%E9%A3%8E%2C16%E6%AF%949%E6%A8%AA%E5%90%91%2C%E7%99%BD%E8%89%B2%E8%AF%81%E4%B9%A6%E8%BE%B9%E6%A1%86&image_size=landscape_4_3',
    href: '#'
  },
  {
    id: 'aliyun-aca-ai',
    name: 'ACA 人工智能助理工程师 · 机器学习平台 PAI',
    tag: '阿里云 · AI',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E9%98%BF%E9%87%8C%E4%BA%91ACA%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD%E5%8A%A9%E7%90%86%E5%B7%A5%E7%A8%8B%E5%B8%88%E8%AF%81%E4%B9%A6%2C%E7%A7%91%E6%8A%80%E6%84%9F%E5%85%89%E7%82%B9%E5%92%8C%E7%A5%9E%E7%BB%8F%E7%BD%91%E7%BB%9C%E8%8A%82%E7%82%B9%E8%83%8C%E6%99%AF%2C%E9%9D%92%E8%93%9D%E6%B8%90%E5%8F%98%2C%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD%E8%89%BA%E6%9C%AF%E5%AD%97%E6%A0%B7%E5%BC%8F%2C16%E6%AF%949%2C%E7%99%BD%E8%89%B2%E5%BE%AE%E7%AB%A0%E8%BE%B9%E6%A1%86&image_size=landscape_4_3',
    href: '#'
  },
  {
    id: 'aliyun-acp-cloud',
    name: 'ACP 云计算专业工程师（备考中）',
    tag: '阿里云 · 进阶',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E9%98%BF%E9%87%8C%E4%BA%91ACP%E4%B8%93%E4%B8%9A%E7%BA%A7%E8%AE%A4%E8%AF%81%E8%AF%81%E4%B9%A6%E5%B0%81%E9%9D%A2%28%E5%A4%87%E8%80%83%E4%B8%AD%E6%A0%87%E7%AD%BE%29%2C%E9%87%91%E5%B1%9E%E6%96%87%E5%AD%97%E4%B8%8E%E6%9D%BF%E5%BC%8F%E8%8A%B1%E7%BA%B9%2C%E9%BB%91%E5%92%8C%E6%B7%B1%E8%93%9D%E9%AB%98%E7%AB%AF%E9%A3%8E%E6%A0%BC%2C%E8%8A%B1%E7%BA%B9%E7%94%B2%E8%99%AB%E7%BA%B9%2C16%E6%AF%949%2C%E9%93%B6%E5%8F%B2%E5%8D%B0%E5%88%B7%E8%AE%BE%E8%AE%A1%E7%BA%AA%E5%BF%B5%E5%BE%BD%E7%AB%A0&image_size=landscape_4_3',
    href: '#'
  },
  {
    id: 'ppt-design-cert',
    name: '商业 PPT 设计 · 接单实战 1000+ 认证',
    tag: '商业 · 设计',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E5%95%86%E4%B8%9APPTDESIGN%E8%AE%BE%E8%AE%A1%E5%AE%9E%E6%88%98%E8%AE%A4%E8%AF%81%E8%AF%81%E4%B9%A6%2C%E6%9F%94%E5%92%8C%E6%9F%B4%E8%89%B2%E4%B8%8E%E5%8D%B7%E8%BD%B4%E9%A3%8E%E6%A0%BC%2C%E7%AC%94%E8%BF%B9%E7%AC%94%E8%AE%B0%E5%8F%8APPT%E5%88%9A%E6%80%A7%E7%95%8C%E9%9D%A2%E5%85%83%E7%B4%A0%2C%E6%9C%A8%E5%A4%B4%E8%89%B2%E8%B0%83%2C16%E6%AF%949%E5%B9%B3%E9%93%BA%E6%8E%92%E7%89%88%2C%E8%AF%81%E4%B9%A6%E7%BA%B8%E8%B4%A8%E7%BA%B9%E7%90%86%E8%83%8C%E6%99%AF&image_size=landscape_4_3',
    href: '#'
  },
  {
    id: 'frontend-fx-cert',
    name: '前端动效与小游戏 · 独立上线项目认证',
    tag: '前端 · 游戏',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E5%89%8D%E7%AB%AF%E5%8A%A8%E6%95%88%E4%B8%8E%E5%B0%8F%E6%B8%B8%E6%88%8F%E7%8B%AC%E7%AB%8B%E4%B8%8A%E7%BA%BF%E8%AE%A4%E8%AF%81%E8%AF%81%E4%B9%A6%2C%E7%B2%92%E5%AD%90%E7%89%B9%E6%95%88%E4%B8%8E%E9%A3%9E%E6%9C%BA%E5%A4%A7%E6%88%98%E8%B4%AD%E7%89%A9%E8%BD%A6%E5%8E%8B%E7%BC%A9%EF%BC%8C%E6%B7%B1%E8%93%9D%E7%99%BD%E8%89%B2%E7%A7%91%E5%B9%BB%E9%A3%8E%2C%E5%85%89%E7%82%B9%E5%92%8C%E8%BF%90%E5%8A%A8%E7%BA%BF%2C16%E6%AF%949%2C%E6%B8%B8%E6%88%8F%E8%83%8C%E6%99%AF%E7%BA%B9%E7%90%86&image_size=landscape_4_3',
    href: '#'
  }
];

const CertStackExample = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background:
        'radial-gradient(1200px 600px at 100% -10%, rgba(120,140,255,0.10), transparent 60%),\n' +
        'radial-gradient(900px 500px at -10% 10%, rgba(255,170,120,0.10), transparent 60%),\n' +
        '#f5f7ff'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '2.5rem 1rem 4rem',
        paddingLeft: 'calc(1rem + env(safe-area-inset-left, 0))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right, 0))'
      }}>
        <CertStackSection
          items={CERTIFICATIONS}
          onStackAll={() => {
            try {
              console.log('[CertStack] 证书全部堆叠完成，可以在这里埋点或加彩蛋');
            } catch (_) {}
          }}
        />
      </div>
    </div>
  );
};

export default CertStackExample;
