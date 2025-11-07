
'use client';
import { useState, useEffect } from 'react';


import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateSummary, setCandidateSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchVertical, setSearchVertical] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: ''
  });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  // Trigger search when searchName or searchVertical changes
  useEffect(() => {
    const handleSearch = async () => {
      if (!searchName.trim() && !searchVertical.trim()) {
        setSearchResults([]);
        return;
      }
      
      setSearching(true);
      try {
        let results = [];

        // If both search terms are provided, search by name first then filter by vertical
        if (searchName.trim() && searchVertical.trim()) {
          const nameResponse = await fetch(`/api/search?name=${encodeURIComponent(searchName)}`);
          const nameData = await nameResponse.json();
          
          if (nameData.results && nameData.results.recruitment_submissions) {
            const nameResults = nameData.results.recruitment_submissions;
            
            // Filter by vertical
            results = nameResults.filter(candidate => {
              const verticals = [
                candidate.vertical_1,
                candidate.vertical_2,
                candidate.vertical_2_2,
                candidate.vertical_2_3,
                candidate.vertical_2_4,
                candidate.vertical_2_5,
                candidate.vertical_2_6,
                candidate.vertical_2_7,
                candidate.vertical_2_8,
                candidate.vertical_2_9
              ].filter(v => v);
              
              return verticals.some(v => 
                v.toLowerCase().includes(searchVertical.toLowerCase())
              );
            });
          }
        } 
        // If only vertical search is provided
        else if (searchVertical.trim()) {
          const verticalResponse = await fetch(`/api/searchVertical?vertical=${encodeURIComponent(searchVertical)}`);
          const verticalData = await verticalResponse.json();
          
          if (verticalData.success && verticalData.results) {
            results = verticalData.results;
          }
        }
        // If only name search is provided
        else if (searchName.trim()) {
          const nameResponse = await fetch(`/api/search?name=${encodeURIComponent(searchName)}`);
          const nameData = await nameResponse.json();
          
          if (nameData.results && nameData.results.recruitment_submissions) {
            results = nameData.results.recruitment_submissions;
          }
        }
        
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (searchName.trim() || searchVertical.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [searchName, searchVertical]);

  // Fetch all scores and group by candidate
  const fetchAllScores = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scores');
      const data = await response.json();
      
      if (data.success) {
        // Group by candidate email
        const grouped = {};
        data.data.forEach(score => {
          if (!grouped[score.candidateEmail]) {
            grouped[score.candidateEmail] = {
              name: score.candidateName,
              email: score.candidateEmail,
              contactNumber: score.contactNumber,
              vertical: score.vertical,
              scores: [],
              totalScores: 0,
              averageScores: {}
            };
          }
          grouped[score.candidateEmail].scores.push(score);
        });

        // Calculate averages for each score type
        Object.keys(grouped).forEach(email => {
          const candidate = grouped[email];
          candidate.totalScores = candidate.scores.length;
          
          const scoreTypes = ['confidence', 'dressing_sense', 'dedication', 'experience', 'preferred_vertical', 'priority'];
          scoreTypes.forEach(type => {
            const validScores = candidate.scores.filter(s => s[type] !== null && s[type] !== undefined);
            if (validScores.length > 0) {
              candidate.averageScores[type] = (
                validScores.reduce((sum, s) => sum + s[type], 0) / validScores.length
              ).toFixed(2);
            } else {
              candidate.averageScores[type] = 'N/A';
            }
          });
          
          // Calculate overall average score
          const allAverages = Object.values(candidate.averageScores).filter(v => v !== 'N/A').map(v => parseFloat(v));
          candidate.averageScore = allAverages.length > 0 ? (allAverages.reduce((a, b) => a + b, 0) / allAverages.length).toFixed(2) : 0;
        });

        setCandidates(Object.values(grouped));
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
      alert('Failed to fetch scores');
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed candidate summary
  const fetchCandidateSummary = async (email) => {
    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const userId = storedUser?.id;
      
      const response = await fetch(`/api/candidates/summary?email=${encodeURIComponent(email)}&userId=${userId}`);
      const data = await response.json();
      
      if (data.success && data.candidate) {
        setCandidateSummary(data);
        setSelectedCandidate(email);
      } else if (data.error === 'You are not authorized to access this page') {
        alert('You are not authorized to access this page');
      } else {
        alert('No score data found for this candidate');
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      alert('Failed to fetch candidate summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllScores();
    }
  }, [user]);

  const getScoreColor = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 4.5) return '#10b981'; // Green (5 stars)
    if (numScore >= 3.5) return '#3b82f6'; // Blue (4 stars)
    if (numScore >= 2.5) return '#f59e0b'; // Yellow (3 stars)
    if (numScore >= 1.5) return '#f97316'; // Orange (2 stars)
    return '#ef4444'; // Red (1 star)
  };

  const getScoreLabel = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 4.5) return 'Excellent'; // 5 stars
    if (numScore >= 3.5) return 'Good'; // 4 stars
    if (numScore >= 2.5) return 'Average'; // 3 stars
    if (numScore >= 1.5) return 'Below Average'; // 2 stars
    return 'Needs Improvement'; // 1 star
  };

  // Handle user creation
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.name || !newUser.password) {
      alert('Please fill in all fields');
      return;
    }

    if (newUser.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setCreatingUser(true);
    
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (data.success) {
        alert(`User created successfully!\nID: ${data.user.id}\nEmail: ${data.user.email}`);
        setShowCreateUserModal(false);
        setNewUser({ email: '', name: '', password: '' });
      } else {
        alert(`Failed to create user: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user. Please try again.');
    } finally {
      setCreatingUser(false);
    }
  };

  // Filter candidates by search terms
  const filteredCandidates = candidates.filter(candidate => {
    const matchesName = !searchName || 
      candidate.name.toLowerCase().includes(searchName.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchName.toLowerCase());
    
    const matchesVertical = !searchVertical ||
      (candidate.vertical && candidate.vertical.toLowerCase().includes(searchVertical.toLowerCase()));
    
    return matchesName && matchesVertical;
  });

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #475569',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ 
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}>
              📊 Admin Dashboard
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              View all candidate scores and statistics
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => router.push('/search')}
              style={{ 
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ← Back to Search
            </button>
            <button 
              onClick={() => setShowCreateUserModal(true)}
              style={{ 
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ➕ Create User
            </button>
            <button 
              onClick={fetchAllScores}
              disabled={loading}
              style={{ 
                padding: '8px 16px',
                backgroundColor: loading ? '#475569' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '30px 20px' }}>
        {loading && candidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
            <div style={{ fontSize: '18px' }}>Loading candidates...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selectedCandidate ? '400px 1fr' : '1fr', gap: '24px' }}>
            {/* Candidates List */}
            <div>
              {/* Search Bars */}
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search by name or email..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#1e293b',
                    color: '#cbd5e1'
                  }}
                />
                <input
                  type="text"
                  placeholder="🎯 Search by vertical..."
                  value={searchVertical}
                  onChange={(e) => setSearchVertical(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#1e293b',
                    color: '#cbd5e1'
                  }}
                />
              </div>

              <div style={{ 
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#cbd5e1' }}>
                  {(searchName || searchVertical) ? `Search Results (${searchResults.length})` : `All Candidates (${filteredCandidates.length})`}
                </h2>
                
                <div style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
                  {searching ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Searching...
                    </div>
                  ) : (searchName || searchVertical) && searchResults.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No candidates found matching your search
                    </div>
                  ) : (searchName || searchVertical) ? (
                    // Show search results from recruitment_submissions
                    searchResults.map((candidate, index) => (
                      <div 
                        key={index}
                        onClick={() => {
                          const email = candidate.email_id || candidate.email || candidate.email_address;
                          if (email) {
                            fetchCandidateSummary(email);
                          }
                        }}
                        style={{ 
                          padding: '16px',
                          marginBottom: '12px',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: '#0f172a',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#1e293b';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#0f172a';
                        }}
                      >
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px', color: '#cbd5e1' }}>
                          {candidate.name}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
                          {candidate.email_id || candidate.email || candidate.email_address || 'No email'}
                        </p>
                        {candidate.vertical_1 && (
                          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                            🎯 {candidate.vertical_1}
                          </p>
                        )}
                        {candidate.contact_number && (
                          <p style={{ fontSize: '12px', color: '#64748b' }}>
                            📞 {candidate.contact_number}
                          </p>
                        )}
                      </div>
                    ))
                  ) : filteredCandidates.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No candidates with scores yet
                    </div>
                  ) : (
                    // Show candidates with scores
                    filteredCandidates.map((candidate, index) => (
                      <div 
                        key={index}
                        onClick={() => fetchCandidateSummary(candidate.email)}
                        style={{ 
                          padding: '16px',
                          marginBottom: '12px',
                          border: selectedCandidate === candidate.email ? '2px solid #a78bfa' : '1px solid #475569',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: selectedCandidate === candidate.email ? '#1a0f1f' : '#0f172a',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedCandidate !== candidate.email) {
                            e.currentTarget.style.backgroundColor = '#1e293b';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedCandidate !== candidate.email) {
                            e.currentTarget.style.backgroundColor = '#0f172a';
                          }
                        }}
                      >
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px', color: '#cbd5e1' }}>
                          {candidate.name}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
                          {candidate.email}
                        </p>
                        {candidate.vertical && (
                          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                            🎯 {candidate.vertical}
                          </p>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ 
                            padding: '6px 12px',
                            backgroundColor: getScoreColor(candidate.averageScore),
                            color: 'white',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {candidate.averageScore}/10
                          </span>
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>
                            {candidate.totalScores} interview{candidate.totalScores !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Candidate Detail */}
            {candidateSummary && candidateSummary.candidate && (
              <div>
                {/* Candidate Info Card */}
                <div style={{ 
                  padding: '24px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#cbd5e1' }}>
                      {candidateSummary.candidate.name}
                    </h2>
                    <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>
                      📧 {candidateSummary.candidate.email}
                    </p>
                    {candidateSummary.candidate.contactNumber && (
                      <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>
                        📱 {candidateSummary.candidate.contactNumber}
                      </p>
                    )}
                    {candidateSummary.candidate.vertical && (
                      <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                        🎯 {candidateSummary.candidate.vertical}
                      </p>
                    )}
                  </div>
                  
                  {/* Statistics */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                    gap: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ 
                      padding: '20px',
                      backgroundColor: '#0d1f17',
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '1px solid #10b981'
                    }}>
                      <div style={{ fontSize: '36px', fontWeight: '700', color: getScoreColor(candidateSummary.statistics.averageScore), marginBottom: '4px' }}>
                        {candidateSummary.statistics.averageScore}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Overall Average</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        {getScoreLabel(candidateSummary.statistics.averageScore)}
                      </div>
                    </div>
                    
                    <div style={{ 
                      padding: '20px',
                      backgroundColor: '#0d1624',
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '1px solid #3b82f6'
                    }}>
                      <div style={{ fontSize: '36px', fontWeight: '700', color: '#60a5fa', marginBottom: '4px' }}>
                        {candidateSummary.statistics.totalInterviews}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Total Interviews</div>
                    </div>
                  </div>
                  
                  {/* Individual Score Averages */}
                  {candidateSummary.statistics.averageScores && (
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '16px', color: '#cbd5e1', marginBottom: '12px', fontWeight: '600' }}>📊 Score Breakdown</h3>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                        gap: '12px'
                      }}>
                        {Object.entries(candidateSummary.statistics.averageScores).map(([key, value]) => (
                          value !== null && (
                            <div key={key} style={{ 
                              padding: '12px',
                              backgroundColor: '#1e293b',
                              borderRadius: '6px',
                              textAlign: 'center',
                              border: '1px solid #475569'
                            }}>
                              <div style={{ fontSize: '24px', fontWeight: '600', color: getScoreColor(value), marginBottom: '4px' }}>
                                {value}
                              </div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', textTransform: 'capitalize' }}>
                                {key.replace(/_/g, ' ')}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* All Scores */}
                <div style={{ 
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#cbd5e1' }}>
                    All Interview Scores
                  </h3>
                  
                  <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {candidateSummary.scores.map((score, index) => (
                      <div 
                        key={index}
                        style={{ 
                          padding: '20px',
                          marginBottom: '16px',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          backgroundColor: '#0f172a'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#cbd5e1', marginBottom: '4px' }}>
                              👤 {score.interviewer}
                            </div>
                            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                              📅 {new Date(score.createdAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            {score.updatedAt !== score.createdAt && (
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                ✏️ Updated: {new Date(score.updatedAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}
                          </div>
                          <div style={{ 
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap'
                          }}>
                            {['confidence', 'dressing_sense', 'dedication', 'experience', 'preferred_vertical', 'priority'].map(type => (
                              score[type] !== null && score[type] !== undefined && (
                                <div key={type} style={{ 
                                  padding: '6px 12px',
                                  backgroundColor: getScoreColor(score[type]),
                                  color: 'white',
                                  borderRadius: '6px',
                                  fontWeight: '600',
                                  fontSize: '13px',
                                  textAlign: 'center'
                                }}>
                                  <div style={{ fontSize: '16px', fontWeight: '700' }}>{score[type]}</div>
                                  <div style={{ fontSize: '9px', opacity: 0.9, textTransform: 'uppercase' }}>
                                    {type.replace(/_/g, ' ')}
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                        
                        {score.feedback && (
                          <div style={{ 
                            padding: '14px',
                            backgroundColor: '#1e293b',
                            borderRadius: '6px',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: '#cbd5e1',
                            border: '1px solid #475569'
                          }}>
                            <div style={{ fontWeight: '600', marginBottom: '6px', color: '#94a3b8', fontSize: '12px' }}>
                              💬 FEEDBACK:
                            </div>
                            {score.feedback}
                          </div>
                        )}
                        
                        {!score.feedback && (
                          <div style={{ 
                            padding: '10px',
                            backgroundColor: '#1e1b0d',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#fbbf24',
                            fontStyle: 'italic'
                          }}>
                            No feedback provided
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty State when no candidate selected */}
            {!candidateSummary && !selectedCandidate && candidates.length > 0 && (
              <div style={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '60px 40px',
                textAlign: 'center',
                color: '#9ca3af'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>👈</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#6b7280' }}>
                  Select a Candidate
                </h3>
                <p style={{ fontSize: '14px' }}>
                  Click on a candidate from the list to view their detailed scores and statistics
                </p>
              </div>
            )}
          </div>
        )}

        {/* No Data State */}
        {!loading && candidates.length === 0 && (
          <div style={{ 
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '80px 40px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: '#6b7280' }}>
              No Score Data Available
            </h3>
            <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px' }}>
              Start scoring candidates from the search page to see data here
            </p>
            <button 
              onClick={() => router.push('/search')}
              style={{ 
                padding: '12px 24px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Go to Search Page
            </button>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={() => setShowCreateUserModal(false)}>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            border: '1px solid #475569',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button 
              onClick={() => setShowCreateUserModal(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#475569',
                color: 'white',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#dc2626';
                e.target.style.transform = 'rotate(90deg)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#475569';
                e.target.style.transform = 'rotate(0deg)';
              }}
            >
              ✕
            </button>

            <h2 style={{ 
              marginBottom: '25px', 
              color: '#cbd5e1',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              ➕ Create New User
            </h2>
            
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#94a3b8', 
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Email Address *
                </label>
                <input 
                  type="email" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                  placeholder="user@example.com"
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #475569', 
                    borderRadius: '6px', 
                    fontSize: '14px', 
                    color: '#cbd5e1',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#94a3b8', 
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Full Name *
                </label>
                <input 
                  type="text" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  required
                  placeholder="John Doe"
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #475569', 
                    borderRadius: '6px', 
                    fontSize: '14px', 
                    color: '#cbd5e1',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#94a3b8', 
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Password *
                </label>
                <input 
                  type="password" 
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #475569', 
                    borderRadius: '6px', 
                    fontSize: '14px', 
                    color: '#cbd5e1',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ 
                  color: '#94a3b8', 
                  fontSize: '12px', 
                  marginTop: '6px',
                  marginBottom: 0
                }}>
                  Password must be at least 6 characters long
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="submit"
                  disabled={creatingUser}
                  style={{ 
                    flex: 1,
                    padding: '14px',
                    background: creatingUser 
                      ? '#475569' 
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: creatingUser ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '700',
                    transition: 'all 0.2s'
                  }}
                >
                  {creatingUser ? 'Creating...' : '✓ Create User'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  style={{ 
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#475569',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '700'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
