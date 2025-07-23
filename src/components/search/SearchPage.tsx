import { UserSearch } from '../common/UserSearch';
import { Layout } from '../layout/Layout';
import './SearchPage.css';

export const SearchPage = () => {
  return (
    <Layout>
      <div className="user-home-container">
        {/* Page Header */}
        <div className="section-header">
          <h1>Find Your Fellow Trainers</h1>
          <p>Connect with trainers worldwide, view their achievements, and track their progress</p>
        </div>

        {/* Search Container */}
        <div className="leaderboards-container">
          <div className="search-card-content">
            <UserSearch />
          </div>
        </div>
      </div>
    </Layout>
  );
}; 