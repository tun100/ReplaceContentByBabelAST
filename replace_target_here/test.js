import React from 'react';
import Moment from 'moment';

@connect(({
  _,
  form
}) => ({
  result: _.testFunc('1234')
}))
class FirstName extends Component {
  shouldComponentUpdate() {
    // test code
    var a = 1 + 203;
  }

  render() {
    return <div>
				<other />
				<parent>
					<Form>
						<Form.Item label={<ErrorTooltip form={form} formName={'myname'} form={formatMessage({
            id: 'mybeforemsg.myname'
          })} />}>
							{form.getFieldDecorator('myname', {})}
						</Form.Item>
						<Form.Item label={<ErrorTooltip form={form} formName={'mynamebb'} form={formatMessage({
            id: 'mybeforemsg.mynamebb'
          })} />}>
							{form.getFieldDecorator('mynamebb', {})}
						</Form.Item>
					</Form>
				</parent>
			</div>;
  }

}