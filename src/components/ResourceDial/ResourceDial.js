import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { spring, Motion } from 'react-motion';
import styled from 'styled-components';
import { format } from 'd3-format';
import { arc } from 'd3-shape';
import { isEmpty, isNumber } from 'lodash';

import theme from '../../theme';

const DIAL_RADIUS_PX = 85;
const DIAL_BORDER_PX = 8;

const roundedValuePercent = usage => {
  // The number is really small (< 0.01%), just indicate
  // the workload isn't using much resources at all.
  if (usage < 0.01) return 0;
  // Need to show 2 decimals when 0.01% <= usage < 0.1%.
  if (usage < 0.1) return format('.2f')(usage);
  // Let's only show 1 decimal when 0.1% <= usage < 5%.
  if (usage < 5) return format('.1f')(usage);
  // Show no decimal data when 10% <= usage
  return format('.0f')(usage);
};

const adjustArc = usage => {
  // Get rounded usage displayed inside the dial as a number [0, 1].
  const roundedUsage = Number(roundedValuePercent(usage * 100)) / 100;
  // If the displayed value is in the interval 0% < x < 1%, round up the dial arc to 1%.
  if (roundedUsage > 0 && roundedUsage < 0.01) return 0.01;
  // Otherwise, let the dial correspond to the displayed value.
  return roundedUsage;
};

const arcPath = arc()
  .innerRadius(DIAL_RADIUS_PX - DIAL_BORDER_PX)
  .outerRadius(DIAL_RADIUS_PX)
  .cornerRadius(5)
  .startAngle(0)
  .endAngle(percentage => 2 * Math.PI * adjustArc(percentage));

const DialLink = styled(Link)`
  border-radius: ${props => props.theme.borderRadius.circle};
  width: ${2 * DIAL_RADIUS_PX}px;
  height: ${2 * DIAL_RADIUS_PX}px;
  display: block;
`;

const DialContainer = styled.div`
  color: ${props => props.theme.colors.gray600};
  border-radius: ${props => props.theme.borderRadius.circle};
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  cursor: default;

  &:not([disabled]):hover {
    cursor: pointer;
    opacity: 0.8;
  }
`;

const DialArc = styled.svg`
  position: absolute;
  pointer-events: none;
  left: 0;
  top: 0;
`;

const DialValueContainer = styled.div`
  display: flex;
  font-weight: bold;
`;

const DialValue = styled.div`
  font-size: ${props => props.theme.fontSizes.huge};
  margin: 0 4px;
`;

const PercentageSign = styled.div`
  font-size: ${props => props.theme.fontSizes.large};
  padding-top: 6px;
  overflow: visible;
  width: 0;
`;

const FillArc = ({ color, value = 1 }) => (
  <path
    transform={`translate(${DIAL_RADIUS_PX}, ${DIAL_RADIUS_PX})`}
    stroke="none"
    fill={color}
    d={arcPath(value)}
  />
);

// TODO: Extract this into the theme.
const dialSpring = value =>
  spring(value, { stiffness: 50, damping: 13, precision: 0.01 });

class ResourceDial extends React.PureComponent {
  render() {
    const { label, value, disabled, to } = this.props;
    const hasLink = !isEmpty(to) && !disabled;
    const hasValue = isNumber(value);

    return (
      <DialLink to={hasLink ? to : ''}>
        <Motion style={{ interpolatedValue: dialSpring(hasValue ? value : 0) }}>
          {({ interpolatedValue }) => (
            <DialContainer disabled={!hasLink}>
              <DialValueContainer>
                <DialValue>
                  {hasValue ? roundedValuePercent(interpolatedValue * 100) : '-'}
                </DialValue>
                {hasValue && <PercentageSign>%</PercentageSign>}
              </DialValueContainer>
              {label}
              <DialArc width="100%" height="100%">
                <FillArc color={theme.colors.gray100} />
                <FillArc
                  color={theme.colors.blue600}
                  value={interpolatedValue}
                />
              </DialArc>
            </DialContainer>
          )}
        </Motion>
      </DialLink>
    );
  }
}

ResourceDial.propTypes = {
  /**
   * Resource usage label shown below the percentage value
   */
  label: PropTypes.string.isRequired,
  /**
   * The percentage value to be displayed by the dial, should be between 0 and 1
   */
  value: PropTypes.number,
  /**
   * Disables the link if set to true
   */
  disabled: PropTypes.bool,
  /**
   * React router link for clicking on the dial
   */
  to: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]),
};

ResourceDial.defaultProps = {
  value: null,
  disabled: false,
  to: '',
};

export default ResourceDial;
