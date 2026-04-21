import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import quiz_data from '../../assets/QuizData'
import Quiz from './Quiz'
import TranslatedText from '../TranslatedText';

function QuizCard({sendIndex}) {

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleStartQuiz = (index) => {
    if (!token) {
      navigate('/login');
    } else {
      sendIndex(index);
      navigate('/quiz');
    }
  };

  return (
    <div className="quiz-card-container">
      {quiz_data.map((quiz, index) => (
        <div id="quiz-card" key={index}>
          <img src={quiz.image} alt={quiz.topic} className="quiz-card-image" />
          <div className="quiz-content">
            <h3><TranslatedText text={quiz.topic} /></h3>
            <p><TranslatedText text={quiz.description} /></p>
            <p><strong>Questions:</strong> {quiz.questionsCount}</p>
            <p><strong>Time Limit:</strong> {quiz.timeLimit}</p>
            <button className="start-quiz" onClick={() => handleStartQuiz(index)}>Start Quiz</button>
          </div>
        </div>
      ))}
    </div>  )
}

export default QuizCard