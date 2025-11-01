import { UserSearch } from '../common/UserSearch';
import { Layout } from '../layout/Layout';
import { MobileFooter } from '../layout/MobileFooter';
import { Footer } from '../common/Footer';
import { useMobile } from '../../hooks/useMobile';
import './SearchPage.css';

export const SearchPage = () => {
  const isMobile = useMobile();

  return (
    <Layout>
      <div 
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: isMobile ? "8px" : "13px",
          width: isMobile ? "100%" : "100%",
          minWidth: isMobile ? "350px" : "353px",
          maxWidth: isMobile ? "390px" : "800px",
          fontFamily: "Poppins, sans-serif",
          color: "#000000",
          margin: "0 auto",
          marginTop: isMobile ? "8px" : "20px",
          padding: isMobile ? "0 16px" : "0px",
          paddingBottom: "100px",
          boxSizing: "border-box",
        }}
      >
        {/* Trainer Directory Header */}
        <div 
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            padding: "0px",
            gap: "2px",
            width: "100%",
            height: "auto",
          }}
        >
          <h1 
            style={{
              width: "100%",
              height: isMobile ? "auto" : "auto",
              fontFamily: "Poppins",
              fontStyle: "normal",
              fontWeight: isMobile ? 500 : 600,
              fontSize: isMobile ? "20px" : "18px",
              lineHeight: isMobile ? "30px" : "1.2",
              color: "#000000",
              margin: "0",
              padding: isMobile ? "0" : "0 0 8px 0",
              textAlign: isMobile ? "center" : "left",
            }}
          >
            Trainer Directory
          </h1>
        </div>

        {/* Search Section */}
        <div 
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            padding: "0px",
            gap: "8px",
            width: "100%",
            height: isMobile ? "auto" : "36px",
          }}
        >
          <UserSearch />
        </div>
      </div>
      
      {/* Mobile Footer */}
      {isMobile && <MobileFooter currentPage="search" />}
      
      {/* Footer */}
      <Footer fixed={true} />
    </Layout>
  );
}; 