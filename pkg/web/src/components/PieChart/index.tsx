import { useCraneUrl } from '../../hooks';
import { Card, CardProps, DateRangePicker, MessagePlugin, Popup } from 'tdesign-react';
import React, { useState } from 'react';
import ReactEcharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { TimeIcon } from 'tdesign-icons-react';
import { useRangePrometheusQuery } from '../../services/prometheusApi';

export interface IPieChart {
  title?: string;
  subTitle?: string;
  // DatePicker option
  datePicker?: boolean;
  // Prometheus Query Time Range unit: second e.g. 1h => 3600
  timeRange?: number;
  // Prometheus Query Step e.g. 15m
  step?: string;
  // legend: string[];
  query: string;
}

const fetchPieData = (craneUrl, title, timeDateRangePicker, step, query) => {
  const start = dayjs(timeDateRangePicker[0]).valueOf();
  const end = dayjs(timeDateRangePicker[1]).valueOf();
  const { data, isError } = useRangePrometheusQuery({ craneUrl, start, end, step, query });
  if (isError) MessagePlugin.error(`[${title}] Check Your Network Or Query Params !!!`, 10 * 1000);
  const result: never[] = [];
  data?.data?.map((namesapce) => {
    const namespaceName = namesapce.metric.namespace;
    namesapce.values.map((value) => {
      const timestamp = dayjs(value[0]).format('MM-DD');
      // const timestamp = value[0];
      const metricValue = value[1];
      if (typeof result[timestamp] !== 'object') result[timestamp] = [];
      const item = {
        name: namespaceName,
        value: metricValue,
      };
      result[timestamp].push(item);
      return value;
    });
    return namesapce;
  });
  return result;
};

const PieChart = ({ title, subTitle, datePicker, timeRange, step, query }: IPieChart) => {
  const craneUrl: any = useCraneUrl();

  // Time
  let timeDateRangePicker;
  let setTimeDateRangePicker: (arg0: any) => void;
  if (timeRange != null) {
    [timeDateRangePicker, setTimeDateRangePicker] = useState([
      dayjs().subtract(timeRange, 's').format('YYYY-MM-DD'),
      dayjs().subtract(0, 's').format('YYYY-MM-DD HH:mm:ss'),
    ]);
  } else {
    [timeDateRangePicker, setTimeDateRangePicker] = useState([
      dayjs().subtract(3, 'days').format('YYYY-MM-DD'),
      dayjs().subtract(0, 's').format('YYYY-MM-DD HH:mm:ss'),
    ]);
  }
  const [presets] = useState({
    最近7天: [dayjs().subtract(7, 'day'), dayjs()],
    最近3天: [dayjs().subtract(3, 'day'), dayjs()],
    最近2天: [dayjs().subtract(2, 'day'), dayjs()],
    最近1天: [dayjs().subtract(1, 'day'), dayjs()],
    实时: [dayjs(), dayjs()],
  });

  const onTimeChange = (time: any) => {
    console.log(time);
    setTimeDateRangePicker(time);
  };

  // Fetch Data
  const pieData = fetchPieData(craneUrl, title, timeDateRangePicker, step, query);

  const timeLineData: string[] = [];
  const options: { series: { data: any; }[]; }[] = [];
  Object.keys(pieData).map(
    (value) =>
      timeLineData.push(value) &&
      options.push({
        series: [{ data: pieData[value] }],
      }),
  );

  const dynamicPieChartOption = {
    tooltip: {
      trigger: 'item',
    },
    grid: {
      top: '0',
      right: '0',
    },
    legend: {
      type: 'scroll',
      top: '0%',
      left: 'center',
    },
    label: {
      show: false,
      position: 'center',
    },
    timeline: {
      currentIndex: Object.keys(pieData).length - 1,
      bottom: '0',
      axisType: 'category',
      data: timeLineData,
    },
    series: [
      {
        type: 'pie',
        height: '90%',
        label: {
          show: false,
        },
      },
    ],
    options,
  };

  return (
    <Card
      title={title}
      subtitle={subTitle}
      actions={
        datePicker && (
          <Popup
            attach='body'
            content={
              <DateRangePicker
                mode='date'
                placeholder={['开始时间', '结束时间']}
                enableTimePicker
                value={timeDateRangePicker}
                format='YYYY-MM-DD HH:mm'
                presets={presets}
                onChange={onTimeChange}
              />
            }
            destroyOnClose={false}
            hideEmptyPopup={false}
            placement='top'
            showArrow={false}
            trigger='hover'
          >
            <TimeIcon />
          </Popup>
        )
      }
    >
      <ReactEcharts option={dynamicPieChartOption} notMerge={true} lazyUpdate={true} />
    </Card>
  );
};

export default React.memo(PieChart);
