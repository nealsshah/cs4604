'use client';

import { useEffect, useRef } from 'react';

interface ReportChartProps {
  data: any;
  reportType: string;
  chartType?: 'bar' | 'line' | 'pie' | 'stat';
}

export default function ReportChart({ data, reportType, chartType = 'stat' }: ReportChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Format numbers for display
  const formatNumber = (num: any): number => {
    if (num === null || num === undefined || num === '') return 0;
    const n = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(n) ? 0 : n;
  };

  // Check if data is completely missing
  if (!data) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
        <p>No data available for this report.</p>
      </div>
    );
  }

  // Render different chart types
  useEffect(() => {
    if (!canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const containerWidth = canvas.offsetWidth || 800;
    canvas.width = containerWidth;
    canvas.height = 400;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (chartType === 'bar') {
      if (Array.isArray(data)) {
        drawBarChart(ctx, canvas, data);
      } else if (typeof data === 'object' && data !== null) {
        // Check if it's comparison data (has avg/min/max properties)
        if (Object.keys(data).some(key => key.toLowerCase().includes('avg') || key.toLowerCase().includes('min') || key.toLowerCase().includes('max'))) {
          drawComparisonBar(ctx, canvas, data);
        } else {
          // Convert object to array for bar chart
          const arrayData = Object.entries(data).map(([key, value]) => ({
            label: key,
            value: formatNumber(value)
          }));
          if (arrayData.length > 0) {
            drawBarChart(ctx, canvas, arrayData);
          }
        }
      }
    } else if (chartType === 'pie' && Array.isArray(data)) {
      drawPieChart(ctx, canvas, data);
    }
  }, [data, chartType]);

  const drawBarChart = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, data: any[]) => {
    if (data.length === 0) return;

    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    const barWidth = chartWidth / (data.length * 2);
    const maxValue = Math.max(...data.map((d: any) => formatNumber(d.value || d.count || d.statusCount || 0)));

    data.forEach((item: any, index: number) => {
      const value = formatNumber(item.value || item.count || item.statusCount || 0);
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * (chartWidth / data.length) + barWidth / 2;
      const y = canvas.height - padding - barHeight;

      // Draw bar
      ctx.fillStyle = `hsl(${(index * 360) / data.length}, 70%, 50%)`;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw label
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      const label = item.label || item.Status || item.month || `Item ${index + 1}`;
      ctx.fillText(label.substring(0, 15), x + barWidth / 2, canvas.height - padding + 15);

      // Draw value
      ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
    });

    // Y-axis
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
  };

  const drawComparisonBar = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, data: any) => {
    // Extract all numeric values and create comparison items
    const items: { label: string; value: number }[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      const numValue = formatNumber(value);
      if (!isNaN(numValue) && numValue >= 0) {
        // Format label nicely
        let label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/avg/i, 'Average')
          .replace(/min/i, 'Minimum')
          .replace(/max/i, 'Maximum')
          .trim();
        items.push({ label, value: numValue });
      }
    });
    
    // Always show items, even if values are zero (for visibility)
    const displayItems = items.length > 0 ? items : [];

    if (displayItems.length === 0) {
      // Draw "No data" message
      ctx.fillStyle = '#999';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
      return;
    }

    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    const barWidth = chartWidth / (displayItems.length * 2);
    const maxValue = Math.max(...displayItems.map(item => item.value), 1); // Ensure at least 1 for division
    const minBarHeight = 10; // Minimum bar height for visibility

    displayItems.forEach((item, index) => {
      const barHeight = Math.max((item.value / maxValue) * chartHeight, minBarHeight);
      const x = padding + index * (chartWidth / displayItems.length) + barWidth / 2;
      const y = canvas.height - padding - barHeight;

      ctx.fillStyle = ['#667eea', '#48bb78', '#f56565'][index % 3];
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, canvas.height - padding + 15);
      const displayValue = item.value % 1 === 0 ? item.value.toString() : item.value.toFixed(2);
      ctx.fillText(displayValue, x + barWidth / 2, y - 5);
    });

    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
  };

  const drawPieChart = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, data: any[]) => {
    if (data.length === 0) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 3;
    const total = data.reduce((sum, item) => sum + formatNumber(item.value || item.count || item.statusCount || 0), 0);

    if (total === 0) return;

    let currentAngle = -Math.PI / 2;

    data.forEach((item: any, index: number) => {
      const value = formatNumber(item.value || item.count || item.statusCount || 0);
      const sliceAngle = (value / total) * 2 * Math.PI;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = `hsl(${(index * 360) / data.length}, 70%, 50%)`;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
      ctx.fillStyle = '#333';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${((value / total) * 100).toFixed(1)}%`, labelX, labelY);

      currentAngle += sliceAngle;
    });

    // Legend
    let legendY = 30;
    data.forEach((item: any, index: number) => {
      ctx.fillStyle = `hsl(${(index * 360) / data.length}, 70%, 50%)`;
      ctx.fillRect(20, legendY, 15, 15);
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      const label = item.label || item.Status || `Item ${index + 1}`;
      ctx.fillText(`${label} (${formatNumber(item.value || item.count || item.statusCount || 0)})`, 40, legendY + 12);
      legendY += 20;
    });
  };

  // Render stat cards only for stat chart type
  if (chartType === 'stat') {
    return (
      <div>
        {Array.isArray(data) ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {data.map((item: any, index: number) => (
              <div key={index} style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
                  {formatNumber(item.value || item.count || item.statusCount || 0)}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  {item.label || item.Status || item.month || `Item ${index + 1}`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {Object.entries(data || {}).map(([key, value]: [string, any]) => (
              <div key={key} style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
                  {typeof value === 'number' ? (value % 1 === 0 ? value.toString() : value.toFixed(2)) : formatNumber(value)}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px', textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render canvas for bar and pie charts
  if (chartType === 'bar' || chartType === 'pie') {
    return (
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <canvas 
          ref={canvasRef} 
          style={{ 
            width: '100%', 
            maxWidth: '800px', 
            height: '400px', 
            display: 'block',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            background: '#fff'
          }} 
        />
      </div>
    );
  }

  // Fallback: show JSON
  return (
    <div style={{ padding: '16px', background: '#fff', borderRadius: '8px' }}>
      <pre style={{ margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

