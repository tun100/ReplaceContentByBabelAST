import React from './node_modules/react';
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
						<Form.Item label={<ErrorTooltip form={form} formName={'surname'} form={formatMessage({
            id: 'mybeforemsg.surname'
          })} />}>
							{form.getFieldDecorator('surname', {})}
						</Form.Item>
						<Form.Item label={<ErrorTooltip form={form} formName={'surnamebb'} form={formatMessage({
            id: 'mybeforemsg.surnamebb'
          })} />}>
							{form.getFieldDecorator('surnamebb', {})}
						</Form.Item>
					</Form>
				</parent>
			</div>;
  }

}