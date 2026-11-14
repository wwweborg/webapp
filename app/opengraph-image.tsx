import {ImageResponse} from 'next/og';
import {OG_IMAGE_ALT} from '@/lib/site';

export const alt = OG_IMAGE_ALT;
export const size = {width: 1200, height: 630};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: 'linear-gradient(135deg, #0B1220 0%, #101B31 55%, #0A2A5E 100%)',
          color: '#F8FAFC',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '76px',
              height: '76px',
              borderRadius: '22px',
              background: '#006FFF',
              fontSize: '44px',
              fontWeight: 700,
              color: '#FFFFFF',
            }}
          >
            W
          </div>
          <div style={{display: 'flex', marginLeft: '24px', fontSize: '30px', letterSpacing: '0.16em', color: '#93B4FF'}}>
            WWWOS
          </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{display: 'flex', fontSize: '104px', fontWeight: 700, letterSpacing: '-0.03em'}}>
            Webapp
          </div>
          <div style={{display: 'flex', marginTop: '18px', fontSize: '38px', color: '#C6D4F0', maxWidth: '900px', lineHeight: 1.25}}>
            Notas Markdown privadas, en tu propio GitHub
          </div>
        </div>

        <div style={{display: 'flex', alignItems: 'center', fontSize: '26px', color: '#8FA3C4'}}>
          <div style={{display: 'flex', width: '10px', height: '10px', borderRadius: '999px', background: '#4ADE80', marginRight: '14px'}} />
          <div style={{display: 'flex'}}>Cifrado E2EE · IA multimodelo · Código abierto</div>
        </div>
      </div>
    ),
    size,
  );
}
