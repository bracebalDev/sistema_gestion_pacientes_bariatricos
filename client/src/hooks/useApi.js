import { useState, useEffect, useCallback } from 'react';

const API_URL = 'http://localhost:3000/api';

export function useApi(collection) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/${collection}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const add = async (item) => {
    try {
      const response = await fetch(`${API_URL}/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const newItem = await response.json();
      setData(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      throw err;
    }
  };

  const update = async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}/${collection}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updatedItem = await response.json();
      setData(prev => prev.map(item => item.id === id ? updatedItem : item));
      return updatedItem;
    } catch (err) {
      throw err;
    }
  };

  const remove = async (id) => {
    try {
      await fetch(`${API_URL}/${collection}/${id}`, {
        method: 'DELETE',
      });
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return { data, loading, error, add, update, remove, refresh: fetchData };
}
