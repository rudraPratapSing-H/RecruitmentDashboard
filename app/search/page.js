
'use client';

import { useState, useEffect } from 'react';







import { useRouter } from 'next/navigation';

export default function SearchPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  // Search states
  const [teamName, setTeamName] = useState('');
  const [candidateName, setCandidateName] = useState('');
  
  // Results states
  const [teamResults, setTeamResults] = useState([]);
  const [candidateResults, setCandidateResults] = useState([]);
  const [teamSearchPerformed, setTeamSearchPerformed] = useState(false);
  const [candidateSearchPerformed, setCandidateSearchPerformed] = useState(false);
  
  // Score modal state
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [scores, setScores] = useState({
    confidence: 0,
    dressing_sense: 0,
    dedication: 0,
    experience: 0,
    preferred_vertical: '',
    priority: 0
  });
  const [feedback, setFeedback] = useState('');
  
  // Text popup modal state
  const [showTextModal, setShowTextModal] = useState(false);
  const [modalText, setModalText] = useState({ title: '', content: '' });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  // Open text modal
  const openTextModal = (title, content) => {
    setModalText({ title, content });
    setShowTextModal(true);
  };

  // Search for teams
  const handleTeamSearch = async () => {
    if (!teamName) return;
    setLoading(true);
    setTeamSearchPerformed(false);
    try {
      const response = await fetch(`/api/teams?name=${encodeURIComponent(teamName)}`);
      const data = await response.json();
      setTeamResults(data.results || []);
      setTeamSearchPerformed(true);
    } catch (error) {
      console.error('Team search error:', error);
      setTeamSearchPerformed(true);
    } finally {
      setLoading(false);
    }
  };

  // Search for candidates
  const handleCandidateSearch = async () => {
    if (!candidateName) return;
    setLoading(true);
    setCandidateSearchPerformed(false);
    try {
      const response = await fetch(`/api/search?name=${encodeURIComponent(candidateName)}`);
      const data = await response.json();
      
      // Get candidates from recruitment_submissions table
      const allCandidates = data.results.recruitment_submissions || [];
      
      setCandidateResults(allCandidates);
      setCandidateSearchPerformed(true);
    } catch (error) {
      console.error('Candidate search error:', error);
      setCandidateSearchPerformed(true);
    } finally {
      setLoading(false);
    }
  };

  // Open score modal
  const openScoreModal = (candidate) => {
    setSelectedCandidate(candidate);
    setScores({
      confidence: 0,
      dressing_sense: 0,
      dedication: 0,
      experience: 0,
      preferred_vertical: '',
      priority: 0
    });
    setFeedback('');
    setShowScoreModal(true);
  };

  // Submit score
  const handleSubmitScore = async () => {
    if (!selectedCandidate || !user) return;

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: selectedCandidate.name,
          candidateEmail: selectedCandidate.email || selectedCandidate.email_address || selectedCandidate.email_id,
          contactNumber: selectedCandidate.contact_number,
          vertical: selectedCandidate.vertical_1 || selectedCandidate.vertical || 'General',
          confidence: scores.confidence,
          dressing_sense: scores.dressing_sense,
          dedication: scores.dedication,
          experience: scores.experience,
          preferred_vertical: scores.preferred_vertical,
          priority: scores.priority,
          interviewer: user.name || user.email,
          feedback: feedback
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Score submitted successfully!');
        setShowScoreModal(false);
        setSelectedCandidate(null);
      } else {
        alert('Failed to submit score: ' + data.error);
      }
    } catch (error) {
      alert('Error submitting score');
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  // Render star rating
  const renderStarRating = (scoreType, value) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setScores({...scores, [scoreType]: star})}
              style={{
                fontSize: '32px',
                cursor: 'pointer',
                color: star <= value ? '#fbbf24' : '#475569',
                transition: 'all 0.2s',
                textShadow: star <= value ? '0 0 10px rgba(251, 191, 36, 0.5)' : 'none',
                filter: star <= value ? 'brightness(1.2)' : 'brightness(0.7)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.2)';
                e.target.style.filter = 'brightness(1.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.filter = star <= value ? 'brightness(1.2)' : 'brightness(0.7)';
              }}
            >
              ⭐
            </span>
          ))}
        </div>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#fbbf24',
          textShadow: '0 0 10px rgba(251, 191, 36, 0.3)'
        }}>
          {value}/5
        </div>
      </div>
    );
  };

  // Render truncated text with click to expand and auto-link URLs
  const renderTruncatedText = (text, maxLength, title) => {
    if (!text) return null;
    const isTruncated = text.length > maxLength;
    const displayText = isTruncated ? text.substring(0, maxLength) + '...' : text;
    
    // Function to convert URLs in text to clickable links
    const linkifyText = (inputText) => {
      // Regular expression to match URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = inputText.split(urlRegex);
      
      return parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a 
              key={index}
              href={part} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#60a5fa', 
                textDecoration: 'underline',
                fontWeight: '500',
                wordBreak: 'break-all'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return part;
      });
    };
    
    return (
      <p 
        style={{ 
          fontSize: '13px', 
          color: '#cbd5e1', 
          lineHeight: '1.6', 
          margin: 0,
          cursor: isTruncated ? 'pointer' : 'default',
          transition: 'color 0.2s'
        }}
        onClick={() => isTruncated && openTextModal(title, text)}
        onMouseOver={(e) => {
          if (isTruncated) e.target.style.color = '#a78bfa';
        }}
        onMouseOut={(e) => {
          if (isTruncated) e.target.style.color = '#cbd5e1';
        }}
        title={isTruncated ? 'Click to read full text' : ''}
      >
        {linkifyText(displayText)}
        {isTruncated && <span style={{ color: '#a78bfa', fontSize: '11px', marginLeft: '4px' }}>(click to expand)</span>}
      </p>
    );
  };

  // Render candidate card with ALL fields
  const renderCandidateCard = (candidate, index) => {
    return (
      <div key={index} style={{ 
        padding: '24px', 
        border: '1px solid #475569', 
        borderRadius: '12px', 
        backgroundColor: '#1e293b',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
      }}>
        {/* Header */}
        <div style={{ 
          borderBottom: '3px solid #667eea', 
          paddingBottom: '12px', 
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          margin: '-24px -24px 16px -24px',
          padding: '16px 24px',
          borderRadius: '12px 12px 0 0'
        }}>
          <h3 style={{ margin: '0 0 6px 0', color: 'white', fontSize: '20px', fontWeight: '600' }}>
            {candidate.name}
          </h3>
          <p style={{ margin: '0', fontSize: '12px', color: '#e0e7ff', fontWeight: '600', letterSpacing: '0.5px' }}>
            RECRUITMENT SUBMISSIONS
          </p>
        </div>

        {/* Contact Info */}
        {(candidate.email_id || candidate.contact_number || candidate.timestamp || candidate.panel_number || candidate.shift) && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            backgroundColor: '#0f172a', 
            borderRadius: '8px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <h4 style={{ fontSize: '14px', color: '#60a5fa', marginBottom: '10px', fontWeight: '600' }}>
              📧 Contact Information
            </h4>
            {candidate.email_id && (
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#cbd5e1' }}>
                <strong style={{ color: '#94a3b8' }}>Email:</strong> {candidate.email_id}
              </p>
            )}
            {candidate.contact_number && (
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#cbd5e1' }}>
                <strong style={{ color: '#94a3b8' }}>Phone:</strong> {candidate.contact_number}
              </p>
            )}
            {candidate.timestamp && (
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#cbd5e1' }}>
                <strong style={{ color: '#94a3b8' }}>Submitted:</strong> {new Date(candidate.timestamp).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            )}
            {candidate.panel_number && (
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#cbd5e1' }}>
                <strong style={{ color: '#94a3b8' }}>Panel:</strong> {candidate.panel_number}
              </p>
            )}
            {candidate.shift && (
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#cbd5e1' }}>
                <strong style={{ color: '#94a3b8' }}>Shift:</strong> {candidate.shift}
              </p>
            )}
          </div>
        )}

        {/* Academic Info */}
        {(candidate.branch || candidate.section || candidate.year) && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#1e1b0d',
            borderRadius: '8px',
            borderLeft: '4px solid #f59e0b'
          }}>
            <h4 style={{ fontSize: '14px', color: '#fbbf24', marginBottom: '10px', fontWeight: '600' }}>
              🎓 Academic Details
            </h4>
            {candidate.branch && (
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#cbd5e1' }}>
                <strong style={{ color: '#94a3b8' }}>Branch:</strong> {candidate.branch}
              </p>
            )}
            {candidate.section && (
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#cbd5e1' }}>
                <strong style={{ color: '#94a3b8' }}>Section:</strong> {candidate.section}
              </p>
            )}
            {candidate.year && (
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#cbd5e1' }}>
                <strong style={{ color: '#94a3b8' }}>Year:</strong> {candidate.year}
              </p>
            )}
          </div>
        )}

        {/* Verticals */}
        {(candidate.vertical_1 || candidate.vertical_2 || candidate.vertical_2_2 || candidate.vertical_2_3 || 
          candidate.vertical_2_4 || candidate.vertical_2_5 || candidate.vertical_2_6 || candidate.vertical_2_7 || 
          candidate.vertical_2_8 || candidate.vertical_2_9) && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '10px', fontWeight: '600' }}>
              💼 Verticals
            </h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {candidate.vertical_1 && (
                <span style={{ 
                  display: 'inline-block',
                  padding: '6px 14px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
                }}>
                  {candidate.vertical_1}
                </span>
              )}
              {[candidate.vertical_2, candidate.vertical_2_2, candidate.vertical_2_3, 
                candidate.vertical_2_4, candidate.vertical_2_5, candidate.vertical_2_6,
                candidate.vertical_2_7, candidate.vertical_2_8, candidate.vertical_2_9]
                .filter(v => v)
                .map((vertical, idx) => (
                  <span key={idx} style={{ 
                    display: 'inline-block',
                    padding: '6px 14px',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(79, 172, 254, 0.3)'
                  }}>
                    {vertical}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* All Links - Comprehensive Display */}
        {(() => {
          const allLinks = [
            { label: 'LinkedIn Profile', url: candidate.linkedin_id, icon: '🔵' },
            { label: 'Resume', url: candidate.resume_link, icon: '📄' },
            { label: 'Portfolio 1', url: candidate.portfolio_link, icon: '🎨' },
            { label: 'Portfolio 2', url: candidate.portfolio_link_2, icon: '🎨' },
            { label: 'Portfolio 3', url: candidate.portfolio_link_3, icon: '🎨' },
            { label: 'Portfolio 4', url: candidate.portfolio_link_4, icon: '🎨' },
            { label: 'Content Task 1-2 Upload', url: candidate.task_upload_1_2, icon: '📎' },
            { label: 'Content Task Report', url: candidate.content_task_report, icon: '📎' },
            { label: 'Content Task 1-2 Upload (V2)', url: candidate.task_upload_1_2_2, icon: '📎' },
            { label: 'Content Task Report (V2)', url: candidate.content_task_report_2, icon: '📎' },
            { label: 'Marketing Task 1 Upload', url: candidate.task_upload_1, icon: '📎' },
            { label: 'Marketing Task 2 Upload', url: candidate.task_upload_2, icon: '📎' },
            { label: 'Marketing Task 1 Upload (V2)', url: candidate.task_upload_1_2_2_again, icon: '📎' },
            { label: 'Marketing Task 2 Upload (V2)', url: candidate.task_upload_2_2, icon: '📎' },
            { label: 'Design Submission', url: candidate.design_submission, icon: '🎨' },
            { label: 'Design Submission (V2)', url: candidate.design_submission_2, icon: '🎨' },
            { label: 'Creatives Submission 1', url: candidate.task_submission, icon: '🎭' },
            { label: 'Creatives Submission 2', url: candidate.task_submission_2, icon: '🎭' },
            { label: 'PR Submission 1', url: candidate.task_submission_3, icon: '📣' },
            { label: 'PR Submission 2', url: candidate.task_submission_4, icon: '📣' },
            { label: 'Strategy Upload 1', url: candidate.strategy_upload, icon: '⚙️' },
            { label: 'Strategy Upload 2', url: candidate.strategy_upload_2, icon: '⚙️' },
            { label: 'Ops Submission 1', url: candidate.ops_submission, icon: '⚙️' },
            { label: 'Ops Submission 2', url: candidate.ops_submission_2, icon: '⚙️' },
            { label: 'Ops Idea Upload 1', url: candidate.ops_idea_upload, icon: '🎯' },
            { label: 'Ops Idea Upload 2', url: candidate.ops_idea_upload_2, icon: '🎯' },
            { label: 'Tech Showcase 1', url: candidate.tech_showcase, icon: '🌟' },
            { label: 'Tech Showcase 2', url: candidate.tech_showcase_2, icon: '🌟' },
          ].filter(item => item.url);

          if (allLinks.length === 0) return null;

          return (
            <div style={{ 
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#0d1f17',
              borderRadius: '8px',
              borderLeft: '4px solid #10b981'
            }}>
              <h4 style={{ fontSize: '14px', color: '#34d399', marginBottom: '10px', fontWeight: '600' }}>
                🔗 All Links ({allLinks.length})
              </h4>
              {allLinks.map((item, idx) => (
                <p key={idx} style={{ margin: '4px 0', fontSize: '13px' }}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" 
                     style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '500' }}>
                    {item.icon} {item.label} →
                  </a>
                </p>
              ))}
            </div>
          );
        })()}

        {/* Introduction */}
        {candidate.introduction && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#1f0d0d',
            borderRadius: '8px',
            borderLeft: '4px solid #f43f5e'
          }}>
            <h4 style={{ fontSize: '14px', color: '#fca5a5', marginBottom: '10px', fontWeight: '600' }}>
              👋 Introduction
            </h4>
            {renderTruncatedText(candidate.introduction, 200, '👋 Introduction')}
          </div>
        )}

        {/* Tech Stack */}
        {(candidate.tech_stack || candidate.tech_stack_2 || candidate.tech_stack_3) && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#1a0f1f',
            borderRadius: '8px',
            borderLeft: '4px solid #8b5cf6'
          }}>
            <h4 style={{ fontSize: '14px', color: '#c084fc', marginBottom: '10px', fontWeight: '600' }}>
              💻 Tech Stack
            </h4>
            {candidate.tech_stack_3 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.tech_stack_3, 200, '💻 Tech Stack')}
              </div>
            )}
            {candidate.tech_stack && (
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0', fontWeight: '500' }}>
                <strong style={{ color: '#c084fc' }}>Primary:</strong> {candidate.tech_stack}
              </p>
            )}
            {candidate.tech_stack_2 && (
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0', fontWeight: '500' }}>
                <strong style={{ color: '#c084fc' }}>Secondary:</strong> {candidate.tech_stack_2}
              </p>
            )}
          </div>
        )}

        {/* Hobbies */}
        {candidate.hobbies && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#0d1f17',
            borderRadius: '8px',
            borderLeft: '4px solid #10b981'
          }}>
            <h4 style={{ fontSize: '14px', color: '#34d399', marginBottom: '10px', fontWeight: '600' }}>
              🎮 Hobbies
            </h4>
            {renderTruncatedText(candidate.hobbies, 200, '🎮 Hobbies')}
          </div>
        )}

        {/* Recruitment Pitch */}
        {candidate.recruitment_pitch && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#1f1409',
            borderRadius: '8px',
            borderLeft: '4px solid #f97316'
          }}>
            <h4 style={{ fontSize: '14px', color: '#fb923c', marginBottom: '10px', fontWeight: '600' }}>
              💡 Recruitment Pitch
            </h4>
            {renderTruncatedText(candidate.recruitment_pitch, 200, '💡 Recruitment Pitch')}
          </div>
        )}

        {/* Technical Experience and Showcase */}
        {(candidate.tech_experience || candidate.tech_experience_2 || candidate.tech_showcase || candidate.tech_showcase_2) && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#0d1624',
            borderRadius: '8px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <h4 style={{ fontSize: '14px', color: '#60a5fa', marginBottom: '10px', fontWeight: '600' }}>
              💼 Technical Experience
            </h4>
            {candidate.tech_experience && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.tech_experience, 200, '💼 Tech Experience 1')}
              </div>
            )}
            {candidate.tech_experience_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.tech_experience_2, 200, '💼 Tech Experience 2')}
              </div>
            )}
            {candidate.tech_showcase && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.tech_showcase} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '500' }}>
                  🌟 Tech Showcase 1 →
                </a>
              </p>
            )}
            {candidate.tech_showcase_2 && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.tech_showcase_2} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '500' }}>
                  🌟 Tech Showcase 2 →
                </a>
              </p>
            )}
          </div>
        )}

        {/* Content Tasks */}
        {(candidate.task_desc_1_2 || candidate.task_upload_1_2 || candidate.task_desc_3 || candidate.content_task_report ||
          candidate.task_desc_1_2_2 || candidate.task_upload_1_2_2 || candidate.task_desc_3_2 || candidate.content_task_report_2) && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#0d1624',
            borderRadius: '8px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <h4 style={{ fontSize: '14px', color: '#60a5fa', marginBottom: '10px', fontWeight: '600' }}>
              📝 Content Tasks
            </h4>
            {candidate.task_desc_1_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.task_desc_1_2, 150, '📝 Content Task 1-2')}
              </div>
            )}
            {candidate.task_upload_1_2 && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.task_upload_1_2} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Task 1-2 Upload →
                </a>
              </p>
            )}
            {candidate.task_desc_3 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.task_desc_3, 150, '📝 Content Task 3')}
              </div>
            )}
            {candidate.content_task_report && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.content_task_report} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Task 3 Report →
                </a>
              </p>
            )}
            {candidate.task_desc_1_2_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.task_desc_1_2_2, 150, '📝 Content Task 1-2 (V2)')}
              </div>
            )}
            {candidate.task_upload_1_2_2 && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.task_upload_1_2_2} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Task 1-2 Upload (V2) →
                </a>
              </p>
            )}
            {candidate.task_desc_3_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.task_desc_3_2, 150, '📝 Content Task 3 (V2)')}
              </div>
            )}
            {candidate.content_task_report_2 && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.content_task_report_2} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Task 3 Report (V2) →
                </a>
              </p>
            )}
          </div>
        )}

        {/* Management/Marketing Tasks */}
        {(candidate.task_mgmt_1 || candidate.task_upload_1 || candidate.task_mgmt_2 || candidate.task_upload_2 ||
          candidate.task_mgmt_1_2 || candidate.task_upload_1_2_2_again || candidate.task_mgmt_2_2 || candidate.task_upload_2_2) && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#1a0d1f',
            borderRadius: '8px',
            borderLeft: '4px solid #d946ef'
          }}>
            <h4 style={{ fontSize: '14px', color: '#e879f9', marginBottom: '10px', fontWeight: '600' }}>
              📢 Management/Marketing Tasks
            </h4>
            {candidate.task_mgmt_1 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.task_mgmt_1, 150, '📢 Marketing Task 1')}
              </div>
            )}
            {candidate.task_upload_1 && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.task_upload_1} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#e879f9', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Marketing Task 1 Upload →
                </a>
              </p>
            )}
            {candidate.task_mgmt_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.task_mgmt_2, 150, '📢 Marketing Task 2')}
              </div>
            )}
            {candidate.task_upload_2 && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.task_upload_2} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#e879f9', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Marketing Task 2 Upload →
                </a>
              </p>
            )}
            {candidate.task_mgmt_1_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.task_mgmt_1_2, 150, '📢 Marketing Task 1 (V2)')}
              </div>
            )}
            {candidate.task_upload_1_2_2_again && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.task_upload_1_2_2_again} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#e879f9', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Marketing Task 1 Upload (V2) →
                </a>
              </p>
            )}
            {candidate.task_mgmt_2_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.task_mgmt_2_2, 150, '📢 Marketing Task 2 (V2)')}
              </div>
            )}
            {candidate.task_upload_2_2 && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.task_upload_2_2} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#e879f9', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Marketing Task 2 Upload (V2) →
                </a>
              </p>
            )}
          </div>
        )}

        {/* Design Tasks */}
        {(candidate.story_idea_1 || candidate.story_idea_2 || candidate.design_submission || candidate.tools_used ||
          candidate.story_idea_1_2 || candidate.story_idea_2_2 || candidate.design_submission_2 || candidate.tools_used_2) && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#1f0d17',
            borderRadius: '8px',
            borderLeft: '4px solid #ec4899'
          }}>
            <h4 style={{ fontSize: '14px', color: '#f472b6', marginBottom: '10px', fontWeight: '600' }}>
              🎨 Design Tasks
            </h4>
            {candidate.story_idea_1 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.story_idea_1, 150, '🎨 Story Idea 1')}
              </div>
            )}
            {candidate.story_idea_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.story_idea_2, 150, '🎨 Story Idea 2')}
              </div>
            )}
            {candidate.design_submission && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.design_submission} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#f472b6', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Design Submission →
                </a>
              </p>
            )}
            {candidate.tools_used && (
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0' }}>
                <strong style={{ color: '#f472b6' }}>Tools:</strong> {candidate.tools_used}
              </p>
            )}
            {candidate.story_idea_1_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.story_idea_1_2, 150, '🎨 Story Idea 1 (V2)')}
              </div>
            )}
            {candidate.story_idea_2_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.story_idea_2_2, 150, '🎨 Story Idea 2 (V2)')}
              </div>
            )}
            {candidate.design_submission_2 && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.design_submission_2} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#f472b6', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Design Submission (V2) →
                </a>
              </p>
            )}
            {candidate.tools_used_2 && (
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0' }}>
                <strong style={{ color: '#f472b6' }}>Tools (V2):</strong> {candidate.tools_used_2}
              </p>
            )}
          </div>
        )}

        {/* Creatives Tasks */}
        {(candidate.task_explanation || candidate.task_submission || candidate.tools_used_3 ||
          candidate.task_explanation_2 || candidate.task_submission_2 || candidate.tools_used_4) && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#1f1409',
            borderRadius: '8px',
            borderLeft: '4px solid #f97316'
          }}>
            <h4 style={{ fontSize: '14px', color: '#fb923c', marginBottom: '10px', fontWeight: '600' }}>
              🎭 Creatives Tasks
            </h4>
            {candidate.task_explanation && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.task_explanation, 150, '🎭 Task Explanation 1')}
              </div>
            )}
            {candidate.task_submission && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.task_submission} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#fb923c', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Creatives Submission 1 →
                </a>
              </p>
            )}
            {candidate.tools_used_3 && (
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0' }}>
                <strong style={{ color: '#fb923c' }}>Tools:</strong> {candidate.tools_used_3}
              </p>
            )}
            {candidate.task_explanation_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.task_explanation_2, 150, '🎭 Task Explanation 2')}
              </div>
            )}
            {candidate.task_submission_2 && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.task_submission_2} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#fb923c', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Creatives Submission 2 →
                </a>
              </p>
            )}
            {candidate.tools_used_4 && (
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0' }}>
                <strong style={{ color: '#fb923c' }}>Tools (V2):</strong> {candidate.tools_used_4}
              </p>
            )}
          </div>
        )}

        {/* PR Tasks */}
        {(candidate.pr_task_explanation || candidate.task_submission_3 || candidate.pr_task_explanation_2 || candidate.task_submission_4) && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#0d1f17',
            borderRadius: '8px',
            borderLeft: '4px solid #10b981'
          }}>
            <h4 style={{ fontSize: '14px', color: '#34d399', marginBottom: '10px', fontWeight: '600' }}>
              📣 PR Tasks
            </h4>
            {candidate.pr_task_explanation && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.pr_task_explanation, 200, '📣 PR Task Explanation 1')}
              </div>
            )}
            {candidate.task_submission_3 && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.task_submission_3} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#34d399', textDecoration: 'none', fontWeight: '500' }}>
                  📎 PR Submission 1 →
                </a>
              </p>
            )}
            {candidate.pr_task_explanation_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.pr_task_explanation_2, 200, '📣 PR Task Explanation 2')}
              </div>
            )}
            {candidate.task_submission_4 && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.task_submission_4} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#34d399', textDecoration: 'none', fontWeight: '500' }}>
                  📎 PR Submission 2 →
                </a>
              </p>
            )}
          </div>
        )}

        {/* Operations/Strategy Tasks */}
        {(candidate.strategy_scenario || candidate.strategy_procedure || candidate.strategy_upload ||
          candidate.strategy_scenario_2 || candidate.strategy_procedure_2 || candidate.strategy_upload_2 ||
          candidate.ops_submission || candidate.ops_submission_2) && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#1a0f1f',
            borderRadius: '8px',
            borderLeft: '4px solid #8b5cf6'
          }}>
            <h4 style={{ fontSize: '14px', color: '#c084fc', marginBottom: '10px', fontWeight: '600' }}>
              ⚙️ Operations/Strategy Tasks
            </h4>
            {candidate.strategy_scenario && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.strategy_scenario, 150, '⚙️ Strategy Scenario 1')}
              </div>
            )}
            {candidate.strategy_procedure && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.strategy_procedure, 150, '⚙️ Strategy Procedure 1')}
              </div>
            )}
            {candidate.strategy_upload && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.strategy_upload} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#c084fc', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Strategy Upload 1 →
                </a>
              </p>
            )}
            {candidate.strategy_scenario_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.strategy_scenario_2, 150, '⚙️ Strategy Scenario 2')}
              </div>
            )}
            {candidate.strategy_procedure_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.strategy_procedure_2, 150, '⚙️ Strategy Procedure 2')}
              </div>
            )}
            {candidate.strategy_upload_2 && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.strategy_upload_2} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#c084fc', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Strategy Upload 2 →
                </a>
              </p>
            )}
            {candidate.ops_submission && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.ops_submission} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#c084fc', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Ops Submission 1 →
                </a>
              </p>
            )}
            {candidate.ops_submission_2 && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.ops_submission_2} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#c084fc', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Ops Submission 2 →
                </a>
              </p>
            )}
          </div>
        )}

        {/* Special Ops Ideas */}
        {(candidate.ops_task_1_idea || candidate.ops_task_2_challenge || candidate.ops_idea_upload ||
          candidate.ops_task_1_idea_2 || candidate.ops_task_2_challenge_2 || candidate.ops_idea_upload_2) && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#1f0d0d',
            borderRadius: '8px',
            borderLeft: '4px solid #f43f5e'
          }}>
            <h4 style={{ fontSize: '14px', color: '#fca5a5', marginBottom: '10px', fontWeight: '600' }}>
              🎯 Special Ops Ideas
            </h4>
            {candidate.ops_task_1_idea && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.ops_task_1_idea, 150, '🎯 Ops Task 1 Idea')}
              </div>
            )}
            {candidate.ops_task_2_challenge && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.ops_task_2_challenge, 150, '🎯 Ops Task 2 Challenge')}
              </div>
            )}
            {candidate.ops_idea_upload && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.ops_idea_upload} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#fca5a5', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Ops Idea Upload 1 →
                </a>
              </p>
            )}
            {candidate.ops_task_1_idea_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.ops_task_1_idea_2, 150, '🎯 Ops Task 1 Idea (V2)')}
              </div>
            )}
            {candidate.ops_task_2_challenge_2 && (
              <div style={{ marginBottom: '8px' }}>
                {renderTruncatedText(candidate.ops_task_2_challenge_2, 150, '🎯 Ops Task 2 Challenge (V2)')}
              </div>
            )}
            {candidate.ops_idea_upload_2 && (
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <a href={candidate.ops_idea_upload_2} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#fca5a5', textDecoration: 'none', fontWeight: '500' }}>
                  📎 Ops Idea Upload 2 →
                </a>
              </p>
            )}
          </div>
        )}

        {/* Give Score Button */}
        <button 
          onClick={() => openScoreModal(candidate)}
          style={{ 
            marginTop: '16px',
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '700',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            letterSpacing: '0.5px'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
          }}
        >
          📊 Give Score
        </button>
      </div>
    );
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        color: 'white',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
      }}>
        <h1 style={{ margin: 0 }}>GDG-IET Recruitment Portal</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span>Welcome, {user.name || user.email}</span>
          <button 
            onClick={() => router.push('/admin')}
            style={{ padding: '8px 16px', backgroundColor: '#1e293b', color: '#a78bfa', border: '1px solid #a78bfa', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#a78bfa';
              e.target.style.color = '#1e293b';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#1e293b';
              e.target.style.color = '#a78bfa';
            }}
          >
            Admin Dashboard
          </button>
          <button 
            onClick={handleLogout}
            style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* Team Search */}
        <div style={{ padding: '20px', border: '2px solid #6366F1', borderRadius: '8px', backgroundColor: '#1e293b', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}>
          <h2 style={{ color: '#a78bfa', marginBottom: '15px' }}>🏆 Search for Teams</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Enter team name..."
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTeamSearch()}
              style={{ flex: 1, padding: '10px', border: '1px solid #475569', borderRadius: '4px', fontSize: '14px', backgroundColor: '#0f172a', color: '#e2e8f0' }}
            />
            <button 
              onClick={handleTeamSearch}
              disabled={loading}
              style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Search
            </button>
          </div>
        </div>

        {/* Candidate Search */}
        <div style={{ padding: '20px', border: '2px solid #10B981', borderRadius: '8px', backgroundColor: '#1e293b', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}>
          <h2 style={{ color: '#34d399', marginBottom: '15px' }}>👥 Search for Candidates</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Enter name or email..."
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCandidateSearch()}
              style={{ flex: 1, padding: '10px', border: '1px solid #475569', borderRadius: '4px', fontSize: '14px', backgroundColor: '#0f172a', color: '#e2e8f0' }}
            />
            <button 
              onClick={handleCandidateSearch}
              disabled={loading}
              style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {loading && <p style={{ textAlign: 'center', fontSize: '18px', color: '#6B7280' }}>🔍 Searching...</p>}

      {/* No Team Results Message */}
      {teamSearchPerformed && teamResults.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          border: '1px solid #475569',
          marginBottom: '30px'
        }}>
          <p style={{ fontSize: '24px', marginBottom: '10px' }}>🔍</p>
          <h3 style={{ color: '#a78bfa', marginBottom: '10px', fontSize: '20px' }}>No Team Results Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            No teams found matching &quot;{teamName}&quot;. Try a different search term.
          </p>
        </div>
      )}

      {/* Team Results */}
      {teamResults.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#a78bfa', textAlign: 'center', marginBottom: '20px' }}>Team Results ({teamResults.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginTop: '15px' }}>
            {teamResults.map((team, index) => (
              <div key={index} style={{ 
                padding: '20px', 
                border: '1px solid #475569', 
                borderRadius: '12px', 
                backgroundColor: '#1e293b',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
              }}
              >
                <h3 style={{ marginBottom: '10px', color: '#a78bfa', fontSize: '18px' }}>{team.team_name}</h3>
                <p style={{ color: '#cbd5e1', marginBottom: '8px' }}><strong style={{ color: '#94a3b8' }}>Idea:</strong> {team.idea_title}</p>
                <p style={{ color: '#cbd5e1', marginBottom: '8px' }}><strong style={{ color: '#94a3b8' }}>Problem ID:</strong> {team.problem_id}</p>
                {team.solution_description && (
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '10px', lineHeight: '1.5' }}>
                    <strong style={{ color: '#cbd5e1' }}>Solution:</strong><br/>
                    {team.solution_description.substring(0, 200)}...
                  </p>
                )}
                {team.presentation_file_path && (
                  <p style={{ marginTop: '10px' }}>
                    <a href={team.presentation_file_path} target="_blank" rel="noopener noreferrer" 
                       style={{ color: '#818cf8', textDecoration: 'none', fontWeight: '500' }}>
                      📊 View Presentation →
                    </a>
                  </p>
                )}
                <span style={{ 
                  display: 'inline-block',
                  marginTop: '10px',
                  padding: '4px 12px',
                  backgroundColor: team.status ? '#10B981' : '#EF4444',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  {team.status ? '✓ Active' : '✗ Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Candidate Results Message */}
      {candidateSearchPerformed && candidateResults.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          border: '1px solid #475569',
          marginTop: '20px'
        }}>
          <p style={{ fontSize: '24px', marginBottom: '10px' }}>🔍</p>
          <h3 style={{ color: '#34d399', marginBottom: '10px', fontSize: '20px' }}>No Candidate Results Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            No candidates found matching &quot;{candidateName}&quot;. Try a different search term.
          </p>
        </div>
      )}

      {/* Candidate Results */}
      {candidateResults.length > 0 && (
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          padding: '0 20px',
          marginTop: '20px'
        }}>
          <div style={{ 
            width: '100%',
            maxWidth: '1400px'
          }}>
            <h2 style={{ 
              color: '#34d399', 
              marginBottom: '25px',
              textAlign: 'center'
            }}>
              Candidate Results ({candidateResults.length})
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 450px))', 
              gap: '30px',
              justifyContent: 'center'
            }}>
              {candidateResults.map((candidate, index) => renderCandidateCard(candidate, index))}
            </div>
          </div>
        </div>
      )}

      {/* Score Modal */}
      {showScoreModal && selectedCandidate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            border: '1px solid #475569'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#cbd5e1' }}>📊 Score Candidate</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8', fontSize: '14px' }}>Name:</label>
              <input 
                type="text" 
                value={selectedCandidate.name} 
                readOnly 
                style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', fontSize: '14px', color: '#cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8', fontSize: '14px' }}>Email:</label>
              <input 
                type="text" 
                value={selectedCandidate.email || selectedCandidate.email_address || selectedCandidate.email_id} 
                readOnly 
                style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', fontSize: '14px', color: '#cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8', fontSize: '14px' }}>Interviewer:</label>
              <input 
                type="text" 
                value={user.name || user.email} 
                readOnly 
                style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', fontSize: '14px', color: '#cbd5e1' }}
              />
            </div>

            {/* Scoring Fields */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1', textAlign: 'center' }}>
                Confidence
              </label>
              {renderStarRating('confidence', scores.confidence)}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1', textAlign: 'center' }}>
                Dressing Sense
              </label>
              {renderStarRating('dressing_sense', scores.dressing_sense)}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1', textAlign: 'center' }}>
                Dedication
              </label>
              {renderStarRating('dedication', scores.dedication)}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1', textAlign: 'center' }}>
                Experience
              </label>
              {renderStarRating('experience', scores.experience)}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1' }}>
                Preferred Vertical
              </label>
              <input
                type="text"
                value={scores.preferred_vertical || ''}
                onChange={(e) => setScores({...scores, preferred_vertical: e.target.value})}
                placeholder="Enter preferred vertical..."
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #475569', 
                  borderRadius: '6px', 
                  fontSize: '14px', 
                  backgroundColor: '#0f172a', 
                  color: '#cbd5e1',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1', textAlign: 'center' }}>
                Priority
              </label>
              {renderStarRating('priority', scores.priority)}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1' }}>Feedback:</label>
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows="4"
                placeholder="Enter your feedback about the candidate..."
                style={{ width: '100%', padding: '10px', border: '1px solid #475569', borderRadius: '6px', resize: 'vertical', fontSize: '14px', fontFamily: 'inherit', backgroundColor: '#0f172a', color: '#cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleSubmitScore}
                style={{ 
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Submit Score
              </button>
              <button 
                onClick={() => setShowScoreModal(false)}
                style={{ 
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#475569',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Popup Modal */}
      {showTextModal && (
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
          zIndex: 2000,
          padding: '20px'
        }}
        onClick={() => setShowTextModal(false)}>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            border: '1px solid #475569',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button 
              onClick={() => setShowTextModal(false)}
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
              marginBottom: '20px', 
              color: '#a78bfa',
              paddingRight: '40px' 
            }}>
              {modalText.title}
            </h2>
            
            <div style={{ 
              fontSize: '15px', 
              color: '#cbd5e1', 
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {(() => {
                // Convert URLs in modal text to clickable links
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const parts = modalText.content.split(urlRegex);
                
                return parts.map((part, index) => {
                  if (part.match(urlRegex)) {
                    return (
                      <a 
                        key={index}
                        href={part} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          color: '#60a5fa', 
                          textDecoration: 'underline',
                          fontWeight: '500',
                          wordBreak: 'break-all'
                        }}
                      >
                        {part}
                      </a>
                    );
                  }
                  return part;
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
